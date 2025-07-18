// web/app.js

/**
 * Frontend logic for the Code Quality Dashboard.
 * This script handles all user interactions, API data fetching, state management,
 * and DOM rendering for the single-page application.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and DOM References ---
    const API_BASE_URL = '/api';
    const languageSelect = document.getElementById('language-select');
    const productAreaFilterInput = document.getElementById(
        'product-area-filter'
    );
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
    const bigqueryViewDisplay = document.getElementById(
        'bigquery-view-display'
    );

    // --- Application State ---
    let currentLanguage = null;
    let currentProductArea = null;
    let currentRegionTag = null;
    let allProductAreas = []; // Cache for the current language's product areas.
    let allRegionTags = []; // Cache for the current product area's region tags.

    // --- Event Listeners ---
    languageSelect.addEventListener('change', handleLanguageChange);
    productAreaFilterInput.addEventListener(
        'input',
        applyProductAreaFiltersAndSorting
    );
    productAreaSortSelect.addEventListener(
        'change',
        applyProductAreaFiltersAndSorting
    );
    regionTagFilterInput.addEventListener(
        'input',
        applyRegionTagFiltersAndSorting
    );
    regionTagSortSelect.addEventListener(
        'change',
        applyRegionTagFiltersAndSorting
    );
    copyLinkButton.addEventListener('click', copyCurrentLink);
    closeErrorModalBtn.addEventListener('click', () =>
        errorModal.classList.add('hidden')
    );

    // --- Initialization ---

    /**
     * Initializes the app by populating the language dropdown and fetching diagnostic info.
     */
    async function initializeApp() {
        try {
            const languages = await fetchLanguages();
            languageSelect.innerHTML =
                '<option selected disabled>Select a Language</option>';
            languages.forEach((lang) => {
                if (!lang) return;
                const option = document.createElement('option');
                option.value = lang;
                option.textContent =
                    lang.charAt(0).toUpperCase() + lang.slice(1);
                languageSelect.appendChild(option);
            });
            await fetchAndDisplayDiagnosticInfo();
        } catch (error) {
            showError(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Fetches and displays diagnostic info (Project ID, etc.) in the footer.
     */
    async function fetchAndDisplayDiagnosticInfo() {
        try {
            const config = await apiFetch('/config');
            if (config.projectId)
                projectIdDisplay.textContent = `Project ID: ${config.projectId}`;
            if (config.bigqueryView)
                bigqueryViewDisplay.textContent = `BigQuery View: ${config.bigqueryView}`;
        } catch (error) {
            // This is non-critical, so we log to console instead of showing a user-facing error.
            console.warn(`Failed to fetch diagnostic info: ${error.message}`);
        }
    }

    // --- Event Handlers ---

    /**
     * Handles a new language selection, fetching the corresponding product areas.
     */
    async function handleLanguageChange(event) {
        currentLanguage = event.target.value;
        if (!currentLanguage) return;

        // Reset downstream UI sections.
        clearProductAreaList();
        clearRegionTagList();
        clearDetailView();
        productAreaList.innerHTML =
            '<p class="text-gray-500">Loading product areas...</p>';
        productAreaFilterInput.value = '';
        regionTagFilterInput.value = '';

        try {
            allProductAreas = await fetchProductAreas(currentLanguage);
            applyProductAreaFiltersAndSorting();
        } catch (error) {
            showError(
                `Failed to fetch product areas for ${currentLanguage}: ${error.message}`
            );
            productAreaList.innerHTML = `<p class="text-red-500">Error loading data.</p>`;
        }
    }

    /**
     * Handles a click on a product area, fetching its region tags.
     */
    async function handleProductAreaClick(clickedElement, productAreaName) {
        currentProductArea = productAreaName;

        // Highlight the selected item for better UX.
        document
            .querySelectorAll('#product-area-list .product-area-item')
            .forEach((item) => item.classList.remove('bg-blue-100'));
        clickedElement.classList.add('bg-blue-100');

        clearRegionTagList();
        clearDetailView();
        regionTagList.innerHTML =
            '<p class="text-gray-500">Loading region tags...</p>';
        regionTagFilterInput.value = '';

        try {
            allRegionTags = await fetchRegionTags(
                currentLanguage,
                currentProductArea
            );
            applyRegionTagFiltersAndSorting();
        } catch (error) {
            showError(
                `Failed to fetch region tags for ${currentProductArea}: ${error.message}`
            );
            regionTagList.innerHTML = `<p class="text-red-500">Error loading data.</p>`;
        }
    }

    /**
     * Handles a click on a region tag, fetching its detailed view.
     */
    async function handleRegionTagClick(clickedElement, regionTagName) {
        currentRegionTag = regionTagName;

        document
            .querySelectorAll('#region-tag-list .region-tag-item')
            .forEach((item) => item.classList.remove('bg-blue-100'));
        clickedElement.classList.add('bg-blue-100');

        clearDetailView();
        detailViewContent.innerHTML =
            '<p class="text-gray-500">Loading details...</p>';

        try {
            const evaluationData = await fetchEvaluationDetails(
                currentLanguage,
                currentProductArea,
                currentRegionTag
            );
            renderDetailView(evaluationData);
        } catch (error) {
            showError(
                `Failed to fetch details for ${currentRegionTag}: ${error.message}`
            );
            detailViewContent.innerHTML = `<p class="text-red-500">Error loading details.</p>`;
        }
    }

    // --- Filtering and Sorting ---

    /**
     * Applies current filter and sort options to the product area list and re-renders it.
     */
    function applyProductAreaFiltersAndSorting() {
        let areasToDisplay = [...allProductAreas];
        const filterText = productAreaFilterInput.value.toLowerCase();
        if (filterText) {
            areasToDisplay = areasToDisplay.filter((area) =>
                area.product_name.toLowerCase().includes(filterText)
            );
        }

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
        renderProductAreaList(areasToDisplay);
    }

    /**
     * Applies current filter and sort options to the region tag list and re-renders it.
     */
    function applyRegionTagFiltersAndSorting() {
        let tagsToDisplay = [...allRegionTags];
        const filterText = regionTagFilterInput.value.toLowerCase();
        if (filterText) {
            tagsToDisplay = tagsToDisplay.filter((tag) =>
                tag.name.toLowerCase().includes(filterText)
            );
        }

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
        renderRegionTagList(tagsToDisplay);
    }

    // --- Rendering ---

    /**
     * Renders the list of product areas.
     */
    function renderProductAreaList(areas) {
        if (!areas || areas.length === 0) {
            productAreaList.innerHTML =
                '<p class="text-gray-500">No matching product areas found.</p>';
            return;
        }
        productAreaList.innerHTML = '';
        areas.forEach((area) => {
            const item = document.createElement('div');
            item.className =
                'product-area-item p-3 rounded-lg hover:bg-gray-100 cursor-pointer border';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-800">${area.product_name}</span>
                    <span class="text-sm text-gray-600">Score: ${Math.round(area.score)}</span>
                </div>
                <div class="text-sm text-gray-500 mt-1">Samples: ${area.samples}</div>
            `;
            item.addEventListener('click', (event) =>
                handleProductAreaClick(event.currentTarget, area.product_name)
            );
            productAreaList.appendChild(item);
        });
    }

    /**
     * Renders the list of region tags.
     */
    function renderRegionTagList(tags) {
        if (!tags || tags.length === 0) {
            regionTagList.innerHTML =
                '<p class="text-gray-500">No matching region tags found.</p>';
            return;
        }
        regionTagList.innerHTML = '';
        tags.forEach((tag) => {
            const item = document.createElement('div');
            item.className =
                'region-tag-item p-3 rounded-lg hover:bg-gray-100 cursor-pointer border';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-medium text-sm text-gray-800 truncate" title="${tag.name}">${tag.name}</span>
                    <span class="text-sm font-bold ${getScoreColorClass(tag.score)}">${tag.score}</span>
                </div>
            `;
            item.addEventListener('click', (event) =>
                handleRegionTagClick(event.currentTarget, tag.name)
            );
            regionTagList.appendChild(item);
        });
    }

    /**
     * Determines the Tailwind CSS class for a score based on the defined ranges.
     */
    function getScoreColorClass(score) {
        if (score <= 60) return 'text-red-700';
        if (score <= 70) return 'text-red-500';
        if (score <= 80) return 'text-orange-500';
        if (score <= 90) return 'text-lime-600';
        return 'text-green-700';
    }

    /**
     * Renders the main detail view with all evaluation data.
     */
    async function renderDetailView(data) {
        const evalJson = data.evaluation_data_raw_json || {};

        let summaryContent;
        const summaryData = evalJson.llm_fix_summary_for_code_generation;
        let items = [];

        if (Array.isArray(summaryData) && summaryData.length > 0) {
            items = summaryData;
        } else if (typeof summaryData === 'string' && summaryData) {
            items = summaryData.split('\n').filter(line => line.trim() !== '');
        }

        if (items.length > 0) {
            const listItems = items.map(item => `<li>${item.trim()}</li>`).join('');
            summaryContent = `<ul class="list-disc list-outside pl-5">${listItems}</ul>`;
        } else {
            summaryContent = '<p>No fixes suggested</p>';
        }

        const formattedLastUpdatedDate = data.last_updated_date?.value
            ? new Date(data.last_updated_date.value).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
              )
            : 'N/A';
        const formattedEvaluationDate = data.evaluation_date?.value
            ? new Date(data.evaluation_date.value).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              })
            : 'N/A';

        const headerHtml = `
            <div class="flex justify-between items-start mb-4 border-b pb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Overall Score</h3>
                    <p class="text-3xl font-bold ${getScoreColorClass(data.overall_compliance_score)}">${data.overall_compliance_score}</p>
                    ${data.github_link ? `<p class="text-sm text-blue-600 hover:underline mt-2"><a href="${data.github_link}" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>` : ''}
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
            </div>`;

        const analysisCardHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-bold mb-4">Evaluation Analysis</h3>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800">Identified Problems:</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${(evalJson.identified_generic_problem_categories || []).map((cat) => `<span class="bg-yellow-200 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${cat}</span>`).join('')}
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Criteria Breakdown:</h4>
                    <div class="space-y-3">
                    ${(evalJson.criteria_breakdown || [])
                        .map((criterion) => {
                            let recommendationText = criterion.recommendations_for_llm_fix || 'N/A';
                            // If recommendations are an array, convert to a Markdown list.
                            if (Array.isArray(recommendationText)) {
                                recommendationText = recommendationText.map(item => `- ${item}`).join('\n');
                            }
                            return `
                                <div class="border rounded-lg p-3 bg-gray-50">
                                    <p class="font-bold">${criterion.criterion_name || 'N/A'} (Score: ${criterion.score} / Weight: ${criterion.weight})</p>
                                    <div class="text-sm text-gray-600 mt-1 prose max-w-none"><strong>Assessment:</strong> ${marked.parse(criterion.assessment || 'N/A')}</div>
                                    <div class="text-sm text-gray-600 mt-1 prose max-w-none"><strong>Recommendation:</strong> ${marked.parse(recommendationText)}</div>
                                </div>`;
                        })
                        .join('')}
                    </div>
                </div>
            </div>`;

        let codeCardHtml =
            '<div class="bg-white p-6 rounded-lg shadow-md mb-6"><h3 class="text-xl font-bold mb-4 text-gray-800">Code File</h3>';
        try {
            if (!data.raw_code)
                throw new Error('Raw code is missing from the data.');
            const validLanguage = hljs.getLanguage(currentLanguage)
                ? currentLanguage
                : 'plaintext';
            const highlightedCode = hljs.highlight(data.raw_code, {
                language: validLanguage,
                ignoreIllegals: true,
            });
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
                    ${summaryContent}
                </div>
            </div>`;

        detailViewContent.innerHTML =
            headerHtml + analysisCardHtml + codeCardHtml + summaryCardHtml;
    }

    // --- API Fetching ---

    /**
     * Generic fetch wrapper for API calls to handle errors consistently.
     */
    async function apiFetch(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.details || errorData.error || 'API request failed'
            );
        }
        return response.json();
    }

    const fetchLanguages = () => apiFetch('/languages');
    const fetchProductAreas = (language) =>
        apiFetch(`/product-areas?language=${encodeURIComponent(language)}`);
    const fetchRegionTags = (language, productArea) =>
        apiFetch(
            `/region-tags?language=${encodeURIComponent(language)}&product_name=${encodeURIComponent(productArea)}`
        );
    const fetchEvaluationDetails = (language, productArea, regionTag) =>
        apiFetch(
            `/details?language=${encodeURIComponent(language)}&product_name=${encodeURIComponent(productArea)}&region_tag=${encodeURIComponent(regionTag)}`
        );

    // --- UI Utilities ---

    const clearProductAreaList = () =>
        (productAreaList.innerHTML =
            '<p class="text-gray-500">Select a language to see product areas.</p>');
    const clearRegionTagList = () =>
        (regionTagList.innerHTML =
            '<p class="text-gray-500">Select a product area to see region tags.</p>');
    const clearDetailView = () =>
        (detailViewContent.innerHTML =
            '<p class="text-gray-500">Select a region tag to see details.</p>');

    function showError(message) {
        console.error(message);
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    /**
     * Copies a deep link to the current view to the clipboard.
     */
    function copyCurrentLink() {
        if (!currentLanguage || !currentProductArea || !currentRegionTag) {
            showError(
                'Please select a language, product area, and region tag to generate a link.'
            );
            return;
        }
        const link = `${window.location.origin}${window.location.pathname}?lang=${encodeURIComponent(currentLanguage)}&pa=${encodeURIComponent(currentProductArea)}&rt=${encodeURIComponent(currentRegionTag)}`;
        navigator.clipboard
            .writeText(link)
            .then(() => {
                const originalText = copyLinkButton.innerHTML;
                copyLinkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg><span>Copied!</span>`;
                setTimeout(() => {
                    copyLinkButton.innerHTML = originalText;
                }, 2000);
            })
            .catch((err) => showError('Failed to copy link: ' + err));
    }

    /**
     * On page load, checks URL for deep-linking parameters and loads the relevant view.
     */
    async function loadFromUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        const pa = params.get('pa');
        const rt = params.get('rt');

        if (lang && pa && rt) {
            try {
                // Set state and UI from URL params
                languageSelect.value = lang;
                currentLanguage = lang;
                await fetchAndDisplayDiagnosticInfo();

                // Fetch and render all levels of data
                allProductAreas = await fetchProductAreas(currentLanguage);
                applyProductAreaFiltersAndSorting();

                currentProductArea = pa;
                allRegionTags = await fetchRegionTags(
                    currentLanguage,
                    currentProductArea
                );
                applyRegionTagFiltersAndSorting();

                currentRegionTag = rt;
                const evaluationData = await fetchEvaluationDetails(
                    currentLanguage,
                    currentProductArea,
                    currentRegionTag
                );
                renderDetailView(evaluationData);
            } catch (error) {
                showError(
                    `Failed to load data from URL parameters: ${error.message}`
                );
            }
        }
    }

    // --- App Initialization ---
    initializeApp();
    loadFromUrlParams();
});
