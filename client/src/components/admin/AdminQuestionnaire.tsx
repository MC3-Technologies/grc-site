import { useState } from "react";
import { surveyJson } from "../../assessmentQuestions";

// Interface for questionnaire page
interface QuestionPage {
  title: string;
  elements: any[];
  id: string;
}

const AdminQuestionnaire = () => {
  // Extract pages from the surveyJson for the UI
  const [pages] = useState<QuestionPage[]>(
    surveyJson.pages.map((page: any, index: number) => ({
      ...page,
      id: `page-${index}`,
    })),
  );

  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);

  // View a specific page's questions
  const handleViewPage = (pageId: string) => {
    setSelectedPage(pageId);
    setEditMode(false);
  };

  // Enter edit mode for a page
  const handleEditPage = () => {
    setEditMode(true);
  };

  // Reset view
  const handleCancelEdit = () => {
    setEditMode(false);
  };

  // Find the selected page object
  const selectedPageObj = pages.find((page) => page.id === selectedPage);

  // Format the element type
  const formatElementType = (type: string) => {
    switch (type) {
      case "text":
        return "Text Input";
      case "radiogroup":
        return "Multiple Choice";
      case "checkbox":
        return "Checkboxes";
      case "comment":
        return "Text Area";
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Pages list */}
      <div className="w-full md:w-1/3">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Questionnaire Sections
          </h3>
          <div className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => handleViewPage(page.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  selectedPage === page.id
                    ? "bg-primary-100 text-primary-800 dark:bg-primary-700 dark:text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="font-medium">{page.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {page.elements.length} question
                  {page.elements.length !== 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page detail view */}
      <div className="w-full md:w-2/3">
        {selectedPage ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedPageObj?.title}
              </h3>
              <div className="space-x-2">
                {editMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditPage}
                    className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Edit Section
                  </button>
                )}
              </div>
            </div>

            {editMode ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Note: In future milestones, we'll implement a visual editor
                  for questions and their logic.
                </p>
                <textarea
                  className="w-full h-80 p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  defaultValue={JSON.stringify(selectedPageObj, null, 2)}
                  readOnly={true} // Read-only for now until we implement full editing
                ></textarea>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPageObj?.elements.map((element, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                        {element.title}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                        {formatElementType(element.type)}
                      </span>
                    </div>

                    {element.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {element.description}
                      </p>
                    )}

                    {element.isRequired && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Required
                      </div>
                    )}

                    {element.choices && (
                      <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Options:
                        </div>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                          {element.choices.map(
                            (choice: any, choiceIndex: number) => (
                              <li key={choiceIndex}>
                                {typeof choice === "object"
                                  ? choice.text
                                  : choice}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {element.visibleIf && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">
                          Conditional Display:
                        </span>{" "}
                        {element.visibleIf}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 p-8 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Select a Section
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Choose a questionnaire section from the list to view its
              questions.
            </p>
          </div>
        )}
      </div>

      {/* Version Control UI - For future implementation */}
      <div className="w-full mt-6">
        <div className="p-4 text-center bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            In future milestones, we'll implement:
          </p>
          <ul className="text-sm text-left list-disc list-inside text-gray-500 dark:text-gray-400">
            <li>Visual question editor</li>
            <li>Question logic conditions</li>
            <li>Questionnaire version control</li>
            <li>Preview functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionnaire;
