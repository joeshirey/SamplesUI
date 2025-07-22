# Product Requirements Document: Code Quality Dashboard

## 1. Overview

The Code Quality Dashboard is a web-based tool designed to provide developers and engineering managers with a clear and concise overview of the code quality across different projects and languages. It visualizes data from BigQuery, allowing users to drill down from a high-level language overview to specific code samples and their quality assessments.

## 2. Goals

- **Provide Visibility:** Offer a centralized and easy-to-understand view of code quality metrics.
- **Identify Problem Areas:** Help teams quickly identify projects, product areas, or specific code snippets that do not meet quality standards.
- **Track Improvement:** Enable teams to track their progress in improving code quality over time.
- **Facilitate Collaboration:** Provide a common platform for developers and managers to discuss and address code quality issues.

## 3. Target Audience

- **Engineering Managers:** To monitor the overall health of their team's codebase and identify areas that need attention.
- **Developers:** To understand the quality of their own code and identify specific areas for improvement.
- **Quality Assurance (QA) Engineers:** To get a high-level overview of code quality before starting the testing process.

## 4. Features

### 4.1. Language Selection

- **FR-1:** Users must be able to select a programming language from a dropdown menu.
- **FR-2:** The list of available languages should be dynamically populated from the BigQuery data source.

### 4.2. Product Area View

- **FR-3:** After selecting a language, the user should see a list of "product areas" associated with that language.
- **FR-4:** For each product area, the dashboard should display:
    - The name of the product area.
    - The number of code samples associated with it.
    - An aggregated "quality score" for that product area.
- **FR-5:** Users must be able to filter the list of product areas by name.
- **FR-6:** Users must be able to filter the list of product areas by product category via a dropdown.
- **FR-7:** Users must be able to sort the list of product areas by name, sample count, or quality score.

### 4.3. Region Tag View

- **FR-8:** After selecting a product area, the user should see a list of "region tags" associated with it.
- **FR-9:** For each region tag, the dashboard should display:
    - The name of the region tag.
    - An individual quality score for that region tag.
- **FR-10:** Users must be able to filter the list of region tags by name.
- **FR-11:** Users must be able to sort the list of region tags by name or quality score.

### 4.4. Detail View

- **FR-12:** After selecting a region tag, the user should see a detailed view of the corresponding code sample.
- **FR-13:** The detail view must display:
    - The overall quality score.
    - The date of the last update and the evaluation date.
    - A breakdown of the evaluation criteria, including the assessment and recommendations for each.
    - Linked icons for any citations in the assessment text, which open in a new tab.
    - The raw code file with syntax highlighting.
    - A summary of suggested fixes from the LLM.
- **FR-14:** Users must be able to copy a direct link to the current detail view.

## 5. Non-Functional Requirements

- **NFR-1: Performance:** The application should load quickly and respond to user interactions within a reasonable time frame.
- **NFR-2: Usability:** The user interface should be intuitive and easy to navigate.
- **NFR-3: Scalability:** The backend should be able to handle a growing amount of data in BigQuery without a significant degradation in performance.
- **NFR-4: Reliability:** The application should be available and functioning correctly during normal working hours.
- **NFR-5: Maintainability:** The codebase should be clean, well-documented, and easy to maintain. This is enforced through a modular architecture and the use of automated linting and formatting tools (ESLint and Prettier).

## 6. Future Enhancements

- **Historical Data:** Display a historical trend of quality scores for each product area and region tag.
- **User Authentication:** Allow users to log in and see a personalized view of the dashboard.
- **Jira Integration:** Create Jira tickets directly from the detail view to track and assign quality issues.
- **Email Notifications:** Send email notifications to relevant stakeholders when quality scores drop below a certain threshold.