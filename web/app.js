// web/app.js - Code Quality Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = '/api';

    // --- DOM Element References ---
    const languageSelect = document.getElementById('language-select');
    const productAreaList = document.getElementById('product-area-list');
    const regionTagList = document.getElementById('region-tag-list');
    const detailViewContent = document.getElementById('detail-view-content');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const closeErrorModalBtn = document.getElementById('close-error-modal');

    // --- State Management ---
    let currentLanguage = null;
    let currentProductArea = null;

    // --- Event Listeners ---
    languageSelect.addEventListener('change', handleLanguageChange);
    closeErrorModalBtn.addEventListener('click', () => errorModal.classList.add('hidden'));

    // --- Core Functions ---

    /**
     * Initializes the application by populating the language dropdown.
     */
    async function initializeApp() {
        try {
            const languages = await fetchLanguages();
            languageSelect.innerHTML = '<option selected disabled>Select a Language</option>';
            languages.forEach(lang => {
                if (!lang) return; // Skip null or empty languages
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
                languageSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Initialization failed: ${error.message} ${error.stack}`);
        }
    }

    /**
     * FR-1: Handles the selection of a new language.
     */
    async function handleLanguageChange(event) {
        currentLanguage = event.target.value;
        if (!currentLanguage) return;

        clearProductAreaList();
        clearRegionTagList();
        clearDetailView();
        productAreaList.innerHTML = '<p class="text-gray-500">Loading product areas...</p>';

        try {
            const productAreas = await fetchProductAreas(currentLanguage);
            renderProductAreaList(productAreas);
        } catch (error) {
            showError(`Failed to fetch product areas for ${currentLanguage}: ${error.message}`);
            productAreaList.innerHTML = `<p class="text-red-500">Error loading data.</p>`;
        }
    }

    /**
     * Handles clicking on a product area.
     */
    async function handleProductAreaClick(clickedElement, productAreaName) {
        currentProductArea = productAreaName;
        
        document.querySelectorAll('#product-area-list .product-area-item').forEach(item => item.classList.remove('bg-blue-100'));
        clickedElement.classList.add('bg-blue-100');

        clearRegionTagList();
        clearDetailView();
        regionTagList.innerHTML = '<p class="text-gray-500">Loading region tags...</p>';

        try {
            const regionTags = await fetchRegionTags(currentLanguage, currentProductArea);
            renderRegionTagList(regionTags);
        } catch (error) {
             showError(`Failed to fetch region tags for ${currentProductArea}: ${error.message}`);
             regionTagList.innerHTML = `<p class="text-red-500">Error loading data.</p>`;
        }
    }

    /**
     * Handles clicking on a region tag.
     */
    async function handleRegionTagClick(clickedElement, regionTagName) {
        document.querySelectorAll('#region-tag-list .region-tag-item').forEach(item => item.classList.remove('bg-blue-100'));
        clickedElement.classList.add('bg-blue-100');
        
        clearDetailView();
        detailViewContent.innerHTML = '<p class="text-gray-500">Loading details...</p>';

        try {
            const evaluationData = await fetchEvaluationDetails(currentLanguage, currentProductArea, regionTagName);
            renderDetailView(evaluationData);
        } catch (error) {
            showError(`Failed to fetch details for ${regionTagName}: ${error.message}`);
            detailViewContent.innerHTML = `<p class="text-red-500">Error loading details.</p>`;
        }
    }

    // --- Rendering Functions ---

    function renderProductAreaList(areas) {
        if (!areas || areas.length === 0) {
            productAreaList.innerHTML = '<p class="text-gray-500">No product areas found for this language.</p>';
            return;
        }
        productAreaList.innerHTML = '';
        areas.forEach(area => {
            const item = document.createElement('div');
            item.className = 'product-area-item p-3 rounded-lg hover:bg-gray-100 cursor-pointer border';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-800">${area.product_area}</span>
                    <span class="text-sm text-gray-600">Score: ${Math.round(area.score)}</span>
                </div>
                <div class="text-sm text-gray-500 mt-1">Samples: ${area.samples}</div>
            `;
            item.addEventListener('click', (event) => handleProductAreaClick(event.currentTarget, area.product_area));
            productAreaList.appendChild(item);
        });
    }

    function renderRegionTagList(tags) {
        if (!tags || tags.length === 0) {
            regionTagList.innerHTML = '<p class="text-gray-500">No region tags found for this product area.</p>';
            return;
        }
        regionTagList.innerHTML = '';
        tags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'region-tag-item p-3 rounded-lg hover:bg-gray-100 cursor-pointer border';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-medium text-sm text-gray-800 truncate" title="${tag.name}">${tag.name}</span>
                    <span class="text-sm font-bold ${tag.score > 85 ? 'text-green-600' : 'text-red-600'}">${tag.score}</span>
                </div>
            `;
            item.addEventListener('click', (event) => handleRegionTagClick(event.currentTarget, tag.name));
            regionTagList.appendChild(item);
        });
    }

    async function renderDetailView(data) {
        const evalJson = data.evaluation_data_raw_json || {};

        // 1. Process LLM Summary for its card
        let summaryListItems;
        const summaryData = evalJson.llm_fix_summary_for_code_generation;
        if (Array.isArray(summaryData) && summaryData.length > 0) {
            summaryListItems = summaryData.map(item => `<li>${item}</li>`).join('');
        } else if (typeof summaryData === 'string' && summaryData) {
            summaryListItems = summaryData.split('\n').filter(line => line.trim() !== '').map(item => `<li>${item.trim()}</li>`).join('');
            if (!summaryListItems) {
                summaryListItems = '<li>No summary available.</li>';
            }
        } else {
            summaryListItems = '<li>No summary available.</li>';
        }

        // 2. Format Dates for the header
        let formattedLastUpdatedDate = 'N/A';
        if (data.last_updated_date && data.last_updated_date.value) {
            formattedLastUpdatedDate = new Date(data.last_updated_date.value).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        let formattedEvaluationDate = 'N/A';
        if (data.evaluation_date && data.evaluation_date.value) {
            formattedEvaluationDate = new Date(data.evaluation_date.value).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        // 3. Build HTML Parts in the new order
        const headerHtml = `
            <div class="flex justify-between items-start mb-4 border-b pb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Overall Score</h3>
                    <p class="text-3xl font-bold ${data.overall_compliance_score > 85 ? 'text-green-600' : 'text-red-600'}">${data.overall_compliance_score}</p>
                </div>
                <div class="text-right space-y-2">
                     <div>
                        <h3 class="text-base font-bold text-gray-800">Last Updated Date</h3>
                        <p class="text-sm text-gray-600">${formattedLastUpdatedDate}</p>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-gray-800">Evaluation Date</h3>
                        <p class="text-sm text-gray-600">${formattedEvaluationDate}</p>
                    </div>
                </div>
            </div>
        `;

        const analysisCardHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-bold mb-4">Evaluation Analysis</h3>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800">Identified Problems:</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${(evalJson.identified_generic_problem_categories || []).map(cat => `<span class="bg-yellow-200 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${cat}</span>`).join('')}
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Criteria Breakdown:</h4>
                    <div class="space-y-3">
                    ${(evalJson.criteria_breakdown || []).map(criterion => `
                        <div class="border rounded-lg p-3 bg-gray-50">
                            <p class="font-bold">${criterion.criterion_name || 'N/A'} (Score: ${criterion.score} / Weight: ${criterion.weight})</p>
                            <p class="text-sm text-gray-600 mt-1"><strong>Assessment:</strong> ${criterion.assessment || 'N/A'}</p>
                            <p class="text-sm text-gray-600 mt-1"><strong>Recommendation:</strong> ${criterion.recommendations_for_llm_fix || 'N/A'}</p>
                        </div>
                    `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        let codeCardHtml = '<div class="bg-white p-6 rounded-lg shadow-md mb-6"><h3 class="text-xl font-bold mb-4 text-gray-800">Code File</h3>';
        try {
            if (!data.github_link) throw new Error("GitHub link is missing from the data.");
            const codeContent = await fetchCodeFromGithub(data.github_link);
            const validLanguage = hljs.getLanguage(currentLanguage) ? currentLanguage : 'plaintext';
            const highlightedCode = hljs.highlight(codeContent, { language: validLanguage, ignoreIllegals: true });
            codeCardHtml += `<pre class="bg-gray-50 p-4 rounded-md"><code class="hljs">${highlightedCode.value}</code></pre>`;
        } catch (error) {
            codeCardHtml += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Could not retrieve file.</strong><span class="block sm:inline">${error.message}</span>
                <p class="mt-2">Link: <a href="${data.github_link}" target="_blank" class="text-blue-500 hover:underline">${data.github_link || 'N/A'}</a></p>
            </div>`;
        }
        codeCardHtml += '</div>';
        
        const summaryCardHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                 <h3 class="text-xl font-bold mb-4">LLM Fix Summary</h3>
                 <ul class="list-disc list-inside text-gray-700 mt-1 space-y-1">
                    ${summaryListItems}
                </ul>
            </div>
        `;

        // 4. Assemble the final view in the correct order
        detailViewContent.innerHTML = headerHtml + analysisCardHtml + codeCardHtml + summaryCardHtml;
    }

    // --- Data Fetching Functions (API Calls) ---
    async function apiFetch(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'API request failed');
        }
        return response.json();
    }
    
    function fetchLanguages() { return apiFetch('/languages'); }
    function fetchProductAreas(language) { return apiFetch(`/product-areas?language=${encodeURIComponent(language)}`); }
    function fetchRegionTags(language, productArea) { return apiFetch(`/region-tags?language=${encodeURIComponent(language)}&product_area=${encodeURIComponent(productArea)}`); }
    function fetchEvaluationDetails(language, productArea, regionTag) { return apiFetch(`/details?language=${encodeURIComponent(language)}&product_area=${encodeURIComponent(productArea)}&region_tag=${encodeURIComponent(regionTag)}`); }
    async function fetchCodeFromGithub(url) {
        const response = await fetch(`${API_BASE_URL}/fetch-code?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to fetch code via proxy');
        }
        return response.text();
    }

    // --- UI Utility Functions ---
    function clearProductAreaList() { productAreaList.innerHTML = '<p class="text-gray-500">Select a language to see product areas.</p>'; }
    function clearRegionTagList() { regionTagList.innerHTML = '<p class="text-gray-500">Select a product area to see region tags.</p>'; }
    function clearDetailView() { detailViewContent.innerHTML = '<p class="text-gray-500">Select a region tag to see details.</p>'; }
    function showError(message) {
        console.error(message);
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    // --- App Initialization ---
    initializeApp();
});
