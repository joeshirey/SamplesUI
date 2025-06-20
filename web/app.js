document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    // This object holds the currently selected items to manage the application's state.
    const state = {
        selectedLanguage: null,
        selectedProductArea: null,
        selectedRegionTag: null,
    };

    // --- DOM SELECTORS ---
    // Caching DOM elements for performance and easier access.
    const languageSelect = document.getElementById('language-select');
    const productAreaList = document.getElementById('product-area-list');
    const regionTagList = document.getElementById('region-tag-list');
    const detailView = document.getElementById('detail-view');
    const detailMessage = document.getElementById('detail-message');

    // --- UTILITY FUNCTIONS ---
    
    /**
     * A reusable function to fetch data from the server, handle errors, and parse JSON.
     * @param {string} url - The URL to fetch data from.
     * @returns {Promise<any>} - The JSON data from the response.
     * @throws {Error} - Throws an error with details if the fetch fails or response is not ok.
     */
    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            // Try to get detailed error from the response body, otherwise use status text
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.details || errorData?.error || response.statusText;
            throw new Error(errorMessage);
        }
        return response.json();
    }
    
    /**
     * Formats a date string or timestamp into a more readable format (e.g., "June 20, 2025").
     * Returns "N/A" if the date is invalid.
     * @param {string | number} dateValue - The date to format.
     * @returns {string} - The formatted date string.
     */
    function formatDate(dateValue) {
        if (!dateValue) return "N/A";
        const date = new Date(dateValue);
        // Check if the date is valid before trying to format it
        if (isNaN(date.getTime())) return "N/A";
        // Using toLocaleDateString for clean, locale-aware date formatting without time.
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' // Assuming dates are in UTC
        });
    }

    // --- RENDER FUNCTIONS ---
    // These functions are responsible for updating the DOM.

    /**
     * Clears and populates the Product Area list.
     * @param {Array<Object>} productAreas - Array of product area objects from the API.
     */
    function renderProductAreaList(productAreas) {
        productAreaList.innerHTML = ''; // Clear previous list
        if (productAreas.length === 0) {
            productAreaList.innerHTML = '<li class="text-gray-500 px-4 py-2">No product areas found.</li>';
            return;
        }
        productAreas.forEach(area => {
            const li = document.createElement('li');
            li.className = 'cursor-pointer hover:bg-blue-100 rounded-md';
            li.dataset.productArea = area.product_area;
            li.innerHTML = `
                <div class="p-3">
                    <p class="font-semibold text-gray-800">${area.product_area}</p>
                    <div class="text-sm text-gray-600 flex justify-between mt-1">
                        <span>Samples: ${area.sample_count}</span>
                        <span>Score: ${area.average_score}</span>
                    </div>
                </div>
            `;
            li.addEventListener('click', () => handleProductAreaClick(area.product_area, li));
            productAreaList.appendChild(li);
        });
    }
    
    /**
     * Clears and populates the Region Tag list.
     * @param {Array<Object>} regionTags - Array of region tag objects from the API.
     */
    function renderRegionTagList(regionTags) {
        regionTagList.innerHTML = ''; // Clear previous list
        if (regionTags.length === 0) {
            regionTagList.innerHTML = '<li class="text-gray-500 px-4 py-2">No tags found.</li>';
            return;
        }
        regionTags.forEach(tag => {
            const li = document.createElement('li');
            li.className = 'cursor-pointer hover:bg-blue-100 rounded-md';
            li.dataset.regionTag = tag.tag;
            li.innerHTML = `
                <div class="p-3 flex justify-between items-center">
                    <span class="font-mono text-sm text-gray-700">${tag.tag}</span>
                    <span class="text-sm font-semibold ${tag.overall_compliance_score < 75 ? 'text-red-600' : 'text-green-600'}">${tag.overall_compliance_score}</span>
                </div>
            `;
            li.addEventListener('click', () => handleRegionTagClick(tag.tag, li));
            regionTagList.appendChild(li);
        });
    }

    /**
     * Renders the main detail view for a selected region tag.
     * @param {Object} details - The detailed data object for a region tag.
     */
    function renderDetailView(details) {
        // --- Safely access nested properties using optional chaining and default values ---
        const evalJson = details.evaluation_data_raw_json || {};
        const score = details.overall_compliance_score || 'N/A';
        const lastUpdated = formatDate(details.last_updated_date);
        const evalDate = formatDate(details.evaluation_date);
        const problems = evalJson.identified_generic_problem_categories || [];
        const criteria = evalJson.criteria_breakdown || [];

        // --- Handle llm_fix_summary_for_code_generation which might be a string or an array ---
        let summaryPoints = [];
        const summaryRaw = evalJson.llm_fix_summary_for_code_generation;
        if (Array.isArray(summaryRaw)) {
            summaryPoints = summaryRaw;
        } else if (typeof summaryRaw === 'string' && summaryRaw.trim() !== '') {
            // If it's a string, split it by newlines to create a list
            summaryPoints = summaryRaw.split('\n').filter(line => line.trim() !== '');
        }

        // --- Build HTML parts for clarity ---
        const topSectionHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Compliance Details</h2>
                    <p class="text-sm text-gray-500 font-mono mt-1">${details.region_tags?.join(', ')}</p>
                </div>
                <div class="text-right">
                     <p class="text-sm text-gray-600">Last Updated: <span class="font-semibold">${lastUpdated}</span></p>
                     <p class="text-sm text-gray-600">Evaluation Date: <span class="font-semibold">${evalDate}</span></p>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg mb-6 flex items-center justify-between">
                <span class="text-lg font-semibold text-gray-700">Overall Score</span>
                <span class="text-3xl font-bold ${score < 75 ? 'text-red-600' : 'text-green-600'}">${score}</span>
            </div>
        `;

        const analysisHTML = `
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Analysis</h3>
            <div class="mb-4">
                <p class="text-gray-600 font-semibold mb-2">Identified Problems:</p>
                <div class="flex flex-wrap gap-2">
                    ${problems.length > 0 ? problems.map(p => `<span class="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${p}</span>`).join('') : '<span class="text-gray-500">None</span>'}
                </div>
            </div>
            <div>
                ${criteria.map(c => `
                    <div class="border border-gray-200 rounded-lg p-3 mb-2">
                        <p class="font-semibold text-gray-700">${c.criterion_name} <span class="text-sm font-normal text-gray-500">(Weight: ${c.weight})</span></p>
                        <p class="text-sm text-gray-600 mt-1">${c.assessment}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        const codeSectionHTML = `
            <div class="mt-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">Code Snippet</h3>
                <a href="${details.github_link}" target="_blank" class="text-sm text-blue-600 hover:underline">${details.github_link}</a>
                <div class="mt-2 bg-gray-50 rounded-lg overflow-hidden border">
                    <pre><code id="code-block" class="language-${details.sample_language}">${'Fetching code...'}</code></pre>
                </div>
            </div>
        `;

        const summaryHTML = `
            <div class="mt-6">
                 <h3 class="text-xl font-semibold text-gray-800 mb-2">LLM Fix Summary</h3>
                 <ul class="list-disc list-inside bg-gray-50 p-4 rounded-lg text-gray-700 space-y-2">
                    ${summaryPoints.length > 0 ? summaryPoints.map(s => `<li>${s.replace(/^\d+\.\s*/, '')}</li>`).join('') : '<li>No summary available.</li>'}
                 </ul>
            </div>
        `;

        // --- Combine and render ---
        detailView.innerHTML = topSectionHTML + analysisHTML + codeSectionHTML + summaryHTML;
        if (detailMessage) detailMessage.classList.add('hidden');
        if (detailView) detailView.classList.remove('hidden');

        // Asynchronously fetch and highlight the code
        fetch(details.github_link)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(text => {
                const codeBlock = document.getElementById('code-block');
                codeBlock.textContent = text;
                hljs.highlightElement(codeBlock);
            })
            .catch(error => {
                console.error("Failed to fetch code from GitHub:", error);
                document.getElementById('code-block').textContent = 'Could not retrieve file content.';
            });
    }
    
    /**
     * Resets a list's active selection.
     * @param {HTMLElement} listElement - The <ul> element to reset.
     */
    function clearActiveSelection(listElement) {
        listElement.querySelectorAll('li').forEach(item => item.classList.remove('bg-blue-200'));
    }

    // --- EVENT HANDLERS ---
    // These functions handle user interactions.

    async function handleLanguageChange() {
        state.selectedLanguage = languageSelect.value;
        // Reset subsequent panels
        productAreaList.innerHTML = '<li class="p-4 text-gray-500">Loading Product Areas...</li>';
        regionTagList.innerHTML = '';
        
        // ** THE FIX IS HERE **
        // Defensively check if these elements exist before trying to manipulate them.
        // This prevents the application from crashing if the HTML is ever out of sync.
        if (detailView) {
            detailView.classList.add('hidden');
        }
        if (detailMessage) {
            detailMessage.classList.remove('hidden');
            detailMessage.textContent = 'Select a product area to see its tags.';
        }
        
        if (state.selectedLanguage) {
            try {
                const productAreas = await fetchData(`/api/product-areas/${state.selectedLanguage}`);
                renderProductAreaList(productAreas);
            } catch (error) {
                productAreaList.innerHTML = `<li class="p-4 text-red-600">Error: ${error.message}</li>`;
            }
        }
    }

    async function handleProductAreaClick(productAreaName, element) {
        state.selectedProductArea = productAreaName;
        // Update UI selection
        clearActiveSelection(productAreaList);
        element.classList.add('bg-blue-200');

        // Reset subsequent panels
        regionTagList.innerHTML = '<li class="p-4 text-gray-500">Loading Tags...</li>';
        if (detailView) detailView.classList.add('hidden');
        if (detailMessage) {
            detailMessage.classList.remove('hidden');
            detailMessage.textContent = 'Select a tag to see details.';
        }
        
        try {
            const regionTags = await fetchData(`/api/region-tags/${state.selectedLanguage}/${state.selectedProductArea}`);
            renderRegionTagList(regionTags);
        } catch (error) {
            regionTagList.innerHTML = `<li class="p-4 text-red-600">Error: ${error.message}</li>`;
        }
    }

    async function handleRegionTagClick(regionTagName, element) {
        state.selectedRegionTag = regionTagName;
        // Update UI selection
        clearActiveSelection(regionTagList);
        element.classList.add('bg-blue-200');

        // Load details
        if (detailView) detailView.classList.add('hidden');
        if (detailMessage) {
            detailMessage.classList.remove('hidden');
            detailMessage.textContent = 'Loading details...';
        }

        try {
            const details = await fetchData(`/api/details/${state.selectedLanguage}/${state.selectedProductArea}/${state.selectedRegionTag}`);
            renderDetailView(details);
        } catch (error) {
            if (detailView) detailView.classList.add('hidden');
            if (detailMessage) {
                detailMessage.classList.remove('hidden');
                detailMessage.innerHTML = `<p class="text-red-600">Error loading details: ${error.message}</p>`;
            }
        }
    }

    // --- INITIALIZATION ---
    async function init() {
        try {
            const languages = await fetchData('/api/languages');
            // Populate language dropdown
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.sample_language;
                option.textContent = lang.sample_language;
                languageSelect.appendChild(option);
            });
            languageSelect.addEventListener('change', handleLanguageChange);
        } catch (error) {
            const errorHtml = `
                <div class="p-4 bg-red-100 text-red-800 rounded-lg">
                    <p class="font-bold">Initialization failed: Failed to fetch languages.</p>
                    <p class="text-sm mt-2">Details: ${error.message}</p>
                </div>
            `;
            // If the app can't initialize, show the error in the main list area.
            productAreaList.innerHTML = errorHtml;
            languageSelect.disabled = true;
        }
    }

    // Start the application
    init();
});
