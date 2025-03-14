import { useState } from "react";

// Interface for report options
interface ReportOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AdminReports = () => {
  // Available report types
  const reportOptions: ReportOption[] = [
    {
      id: "compliance-summary",
      name: "Compliance Summary",
      description: "Overview of compliance status across all completed assessments",
      icon: "compliance"
    },
    {
      id: "user-activity",
      name: "User Activity",
      description: "Summary of user registrations, logins, and assessment activity",
      icon: "users"
    },
    {
      id: "assessment-analytics",
      name: "Assessment Analytics",
      description: "Detailed analysis of assessment responses and trends",
      icon: "analytics"
    },
    {
      id: "export-data",
      name: "Export Data",
      description: "Export raw assessment and user data for external analysis",
      icon: "export"
    }
  ];

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "custom">("30days");
  const [generating, setGenerating] = useState<boolean>(false);

  // Placeholder for report generation
  const handleGenerateReport = () => {
    setGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
    }, 2000);
  };

  // Render icon based on type
  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "compliance":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case "users":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
          </svg>
        );
      case "analytics":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
          </svg>
        );
      case "export":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => setSelectedReport(option.id)}
            className={`p-4 cursor-pointer border rounded-lg transition ${
              selectedReport === option.id
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-start">
              <div className={`p-3 mr-4 rounded-full ${
                selectedReport === option.id
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}>
                {renderIcon(option.icon)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Report Options
          </h3>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateRange("7days")}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  dateRange === "7days"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange("30days")}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  dateRange === "30days"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange("90days")}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  dateRange === "90days"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Last 90 Days
              </button>
              <button
                onClick={() => setDateRange("custom")}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  dateRange === "custom"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Start Date
                </label>
                <input
                  type="date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  End Date
                </label>
                <input
                  type="date"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
            </div>
          )}
          
          {/* Report format options */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Report Format
            </label>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
            </select>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 flex items-center"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Future implementation notes */}
      <div className="mt-8 text-center p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          In future milestones, we'll implement:
        </p>
        <ul className="mt-2 text-sm text-left list-disc list-inside text-gray-500 dark:text-gray-400">
          <li>Real-time data visualization dashboards</li>
          <li>Customizable report templates</li>
          <li>Scheduled report generation</li>
          <li>PDF and Excel export functionality</li>
          <li>Email report delivery</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminReports;