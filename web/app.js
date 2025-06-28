// web/app.js - Code Quality Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = '/api';

    // --- DOM Element References ---
    const languageSelect = document.getElementById('language-select');
    const productAreaFilterInput = document.getElementById('product-area-filter');
    const productAreaSortSelect = document.getElementById('product-area-sort');
    const productAreaList = document.getElementById('product-area-list');
    const regionTagFilterInput = document.getElementById('region-tag-filter');
    const regionTagSortSelect = document.getElementById('region-tag-sort');
    const regionTagList = document.getElementById('region-tag-list');
    const detailViewContent = document.getElementById('detail-view-content');
    const copyLinkButton = document.getElementById('copy-link-button');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const closeErrorModalBtn = document.getElementById('close-error-modal');
    const projectIdDisplay = document.getElementById('project-id-display');
    const bigqueryViewDisplay = document.getElementById('bigquery-view-display');

    // --- State Management ---
    let currentLanguage = null;
    let currentProductArea = null;
    let currentRegionTag = null; // New state variable for the currently selected region tag
    let allProductAreas = []; // Store all fetched product areas
    let filteredAndSortedProductAreas = []; // Store the currently displayed product areas
    let allRegionTags = []; // Store all fetched region tags for the current product area
    let filteredAndSortedRegionTags = []; // Store the currently displayed region tags

    // --- Event Listeners ---
    languageSelect.addEventListener('change', handleLanguageChange);
    productAreaFilterInput.addEventListener('input', applyProductAreaFiltersAndSorting);
    productAreaSortSelect.addEventListener('change', applyProductAreaFiltersAndSorting);
    regionTagFilterInput.addEventListener('input', applyRegionTagFiltersAndSorting);
    regionTagSortSelect.addEventListener('change', applyRegionTagFiltersAndSorting);
    copyLinkButton.addEventListener('click', copyCurrentLink);
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
            await fetchAndDisplayDiagnosticInfo(); // Fetch and display diagnostic info
        } catch (error) {
            showError(`Initialization failed: ${error.message} ${error.stack}`);
        }
    }

    /**
     * Fetches and displays the Project ID and BigQuery view name.
     */
    async function fetchAndDisplayDiagnosticInfo() {
        try {
            const config = await apiFetch('/config'); // Assuming a new endpoint for config
            if (config.projectId) {
                projectIdDisplay.textContent = `Project ID: ${config.projectId}`;
            }
            if (config.bigqueryView) {
                bigqueryViewDisplay.textContent = `BigQuery View: ${config.bigqueryView}`;
            }
        } catch (error) {
            console.warn(`Failed to fetch diagnostic info: ${error.message}`);
            // Do not show a modal error for diagnostic info, just log to console
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
        productAreaFilterInput.value = ''; // Clear product area filter on language change
        regionTagFilterInput.value = ''; // Clear region tag filter on language change

        try {
            allProductAreas = await fetchProductAreas(currentLanguage);
            applyProductAreaFiltersAndSorting(); // Apply initial sort/filter for product areas
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
        regionTagFilterInput.value = ''; // Clear region tag filter on product area change

        try {
            allRegionTags = await fetchRegionTags(currentLanguage, currentProductArea);
            applyRegionTagFiltersAndSorting(); // Apply initial sort/filter for region tags
        } catch (error) {
             showError(`Failed to fetch region tags for ${currentProductArea}: ${error.message}`);
             regionTagList.innerHTML = `<p class="text-red-500">Error loading data.</p>`;
        }
    }

    /**
     * Handles clicking on a region tag.
     */
    async function handleRegionTagClick(clickedElement, regionTagName) {
        currentRegionTag = regionTagName; // Update currentRegionTag
        
        document.querySelectorAll('#region-tag-list .region-tag-item').forEach(item => item.classList.remove('bg-blue-100'));
        clickedElement.classList.add('bg-blue-100');

        clearDetailView();
        detailViewContent.innerHTML = '<p class="text-gray-500">Loading details...</p>';

        try {
            const evaluationData = await fetchEvaluationDetails(currentLanguage, currentProductArea, currentRegionTag);
            renderDetailView(evaluationData);
        } catch (error) {
            showError(`Failed to fetch details for ${currentRegionTag}: ${error.message}`);
            detailViewContent.innerHTML = `<p class="text-red-500">Error loading details.</p>`;
        }
    }

    // --- Filtering and Sorting Logic ---

    function applyProductAreaFiltersAndSorting() {
        let areasToDisplay = [...allProductAreas]; // Start with all fetched areas

        // Apply Filter
        const filterText = productAreaFilterInput.value.toLowerCase();
        if (filterText) {
            areasToDisplay = areasToDisplay.filter(area =>
                area.product_name.toLowerCase().includes(filterText)
            );
        }

        // Apply Sort
        const sortOption = productAreaSortSelect.value;
        areasToDisplay.sort((a, b) => {
            switch (sortOption) {
                case 'name':
                    return a.product_name.localeCompare(b.product_name);
                case 'count-desc':
                    return b.samples - a.samples;
                case 'count-asc':
                    return a.samples - b.samples;
                case 'score-desc':
                    return b.score - a.score;
                case 'score-asc':
                    return a.score - b.score;
                default:
                    return 0;
            }
        });

        filteredAndSortedProductAreas = areasToDisplay;
        renderProductAreaList(filteredAndSortedProductAreas);
    }

    function applyRegionTagFiltersAndSorting() {
        let tagsToDisplay = [...allRegionTags]; // Start with all fetched region tags

        // Apply Filter
        const filterText = regionTagFilterInput.value.toLowerCase();
        if (filterText) {
            tagsToDisplay = tagsToDisplay.filter(tag =>
                tag.name.toLowerCase().includes(filterText)
            );
        }

        // Apply Sort
        const sortOption = regionTagSortSelect.value;
        tagsToDisplay.sort((a, b) => {
            switch (sortOption) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'score-desc':
                    return b.score - a.score;
                case 'score-asc':
                    return a.score - b.score;
                default:
                    return 0;
            }
        });

        filteredAndSortedRegionTags = tagsToDisplay;
        renderRegionTagList(filteredAndSortedRegionTags);
    }

    // --- Rendering Functions ---

    function renderProductAreaList(areas) {
        if (!areas || areas.length === 0) {
            productAreaList.innerHTML = '<p class="text-gray-500">No matching product areas found.</p>';
            return;
        }
        productAreaList.innerHTML = '';
        areas.forEach(area => {
            const item = document.createElement('div');
            item.className = 'product-area-item p-3 rounded-lg hover:bg-gray-100 cursor-pointer border';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-800">${area.product_name}</span>
                    <span class="text-sm text-gray-600">Score: ${Math.round(area.score)}</span>
                </div>
                <div class="text-sm text-gray-500 mt-1">Samples: ${area.samples}</div>
            `;
            item.addEventListener('click', (event) => handleProductAreaClick(event.currentTarget, area.product_name));
            productAreaList.appendChild(item);
        });
    }

    function renderRegionTagList(tags) {
        if (!tags || tags.length === 0) {
            regionTagList.innerHTML = '<p class="text-gray-500">No matching region tags found.</p>';
            return;
        }
        regionTagList.innerHTML = '';
        tags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'region-tag-item p-3 rounded-lg hover:bg-gray-100 cursor-pointer border';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-medium text-sm text-gray-800 truncate" title="${tag.name}">${tag.name}</span>
                    <span class="text-sm font-bold ${getScoreColorClass(tag.score)}">${tag.score}</span>
                </div>
            `;
            item.addEventListener('click', (event) => handleRegionTagClick(event.currentTarget, tag.name));
            regionTagList.appendChild(item);
        });
    }

    /**
     * Determines the Tailwind CSS class for a score based on the defined ranges.
     * @param {number} score The score value.
     * @returns {string} The Tailwind CSS class for the score color.
     */
    function getScoreColorClass(score) {
        if (score <= 60) {
            return 'text-red-700'; // Red
        } else if (score >= 61 && score <= 70) {
            return 'text-red-500'; // Light Red
        } else if (score >= 71 && score <= 80) {
            return 'text-orange-500'; // Orange
        } else if (score >= 81 && score <= 90) {
            return 'text-lime-600'; // Light Green (using lime for a distinct shade)
        } else if (score >= 91) {
            return 'text-green-700'; // Green
        }
        return 'text-gray-700'; // Default color if score is out of expected range
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
                    <p class="text-3xl font-bold ${getScoreColorClass(data.overall_compliance_score)}">${data.overall_compliance_score}</p>
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
            if (!data.raw_code) throw new Error("Raw code is missing from the data.");
            const validLanguage = hljs.getLanguage(currentLanguage) ? currentLanguage : 'plaintext';
            const highlightedCode = hljs.highlight(data.raw_code, { language: validLanguage, ignoreIllegals: true });
            codeCardHtml += `<pre class="bg-gray-50 p-4 rounded-md"><code class="hljs">${highlightedCode.value}</code></pre>`;
        } catch (error) {
            codeCardHtml += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Could not retrieve code.</strong><span class="block sm:inline">${error.message}</span>
            </div>`;
        }
        codeCardHtml += '</div>';
        
        const summaryCardHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                 <h3 class="text-xl font-bold mb-4">LLM Suggested Fixes</h3>
                 <div class="text-gray-700 mt-1 space-y-1">
                    ${summaryListItems}
                </div>
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
    function fetchRegionTags(language, productArea) { return apiFetch(`/region-tags?language=${encodeURIComponent(language)}&product_name=${encodeURIComponent(productArea)}`); }
    function fetchEvaluationDetails(language, productArea, regionTag) { return apiFetch(`/details?language=${encodeURIComponent(language)}&product_name=${encodeURIComponent(productArea)}&region_tag=${encodeURIComponent(regionTag)}`); }

    // --- UI Utility Functions ---
    function clearProductAreaList() { productAreaList.innerHTML = '<p class="text-gray-500">Select a language to see product areas.</p>'; }
    function clearRegionTagList() { regionTagList.innerHTML = '<p class="text-gray-500">Select a product area to see region tags.</p>'; }
    function clearDetailView() { detailViewContent.innerHTML = '<p class="text-gray-500">Select a region tag to see details.</p>'; }
    function showError(message) {
        console.error(message);
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    /**
     * Copies a hard link to the current detail view to the clipboard.
     */
    function copyCurrentLink() {
        if (!currentLanguage || !currentProductArea || !currentRegionTag) {
            showError('Please select a language, product area, and region tag to generate a link.');
            return;
        }

        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?lang=${encodeURIComponent(currentLanguage)}&pa=${encodeURIComponent(currentProductArea)}&rt=${encodeURIComponent(currentRegionTag)}`;

        navigator.clipboard.writeText(link).then(() => {
            // Provide visual feedback
            const originalText = copyLinkButton.innerHTML;
            copyLinkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg><span>Copied!</span>`;
            setTimeout(() => {
                copyLinkButton.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            showError('Failed to copy link: ' + err);
        });
    }

    /**
     * Parses URL parameters and attempts to load the corresponding data.
     */
    async function loadFromUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        const pa = params.get('pa');
        const rt = params.get('rt');

        if (lang) {
            // Select the language in the dropdown
            languageSelect.value = lang;
            currentLanguage = lang;
            
            // Fetch product areas and then attempt to select product area and region tag
            try {
                allProductAreas = await fetchProductAreas(currentLanguage);
                applyProductAreaFiltersAndSorting(); // Render product areas

                if (pa) {
                    currentProductArea = pa;
                    // Simulate click on product area to load region tags
                    // This is a simplified approach; a more robust solution might involve
                    // finding the actual DOM element and triggering a click, or
                    // directly calling handleProductAreaClick with a dummy element.
                    // For now, we'll just fetch region tags directly.
                    allRegionTags = await fetchRegionTags(currentLanguage, currentProductArea);
                    applyRegionTagFiltersAndSorting(); // Render region tags

                    if (rt) {
                        currentRegionTag = rt;
                        // Directly render detail view
                        const evaluationData = await fetchEvaluationDetails(currentLanguage, currentProductArea, currentRegionTag);
                        renderDetailView(evaluationData);
                    }
                }
            } catch (error) {
                showError(`Failed to load data from URL parameters: ${error.message}`);
            }
        }
    }

    // --- App Initialization ---
    initializeApp();
    loadFromUrlParams(); // Attempt to load data from URL parameters on initial load
});
