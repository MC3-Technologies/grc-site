import { useState } from "react";
import { surveyJson } from "../../assessmentQuestions";
import {
  SurveyElement,
  ChoiceItem,
  QuestionPage,
  SurveyPage,
  loadSavedQuestionnaire,
  QUESTIONNAIRE_STORAGE_KEY,
} from "../../utils/questionnaireUtils";

// New interface for edit form element state
interface EditFormElement extends SurveyElement {
  id: string;
}

const AdminQuestionnaire = () => {
  // Extract pages from the surveyJson for the UI, with localStorage persistence
  const [pages, setPages] = useState<QuestionPage[]>(() => {
    const savedData = loadSavedQuestionnaire();
    if (savedData) {
      console.log("Loaded saved questionnaire data from localStorage");
      return savedData;
    }

    console.log("Using default questionnaire data");
    return surveyJson.pages.map((page: SurveyPage, index: number) => ({
      ...page,
      id: `page-${index}`,
    }));
  });

  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);

  // New state for editing form
  const [editForm, setEditForm] = useState<{
    title: string;
    elements: EditFormElement[];
  } | null>(null);

  // State for drag and drop functionality
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // Success notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Event for notifying other components of questionnaire updates
  const notifyQuestionnaireUpdate = () => {
    // Create a custom event to notify other components that the questionnaire has been updated
    const event = new CustomEvent("questionnaireUpdated", {
      detail: { timestamp: new Date().toISOString() },
    });
    document.dispatchEvent(event);
  };

  // View a specific page's questions
  const handleViewPage = (pageId: string) => {
    setSelectedPage(pageId);
    setEditMode(false);
    setEditForm(null);
  };

  // Enter edit mode for a page
  const handleEditPage = () => {
    // Initialize the edit form with the current page data
    if (selectedPageObj) {
      setEditForm({
        title: selectedPageObj.title,
        elements: selectedPageObj.elements.map((element, index) => ({
          ...element,
          id: `element-${index}`,
        })),
      });
      setEditMode(true);
    }
  };

  // Reset view
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditForm(null);
  };

  // Handle form changes
  const handleFormChange = (field: string, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  // Handle element changes
  const handleElementChange = (
    elementId: string,
    field: string,
    value: unknown,
  ) => {
    if (editForm) {
      const updatedElements = editForm.elements.map((element) =>
        element.id === elementId ? { ...element, [field]: value } : element,
      );

      setEditForm({
        ...editForm,
        elements: updatedElements,
      });
    }
  };

  // Add new question
  const handleAddQuestion = () => {
    if (editForm) {
      // Create a new element with default values
      const newElement: EditFormElement = {
        id: `element-${editForm.elements.length}`,
        name: `question_${Date.now()}`, // Add a unique name for the question
        type: "text",
        title: "New Question",
        isRequired: false,
      };

      setEditForm({
        ...editForm,
        elements: [...editForm.elements, newElement],
      });
    }
  };

  // Delete question
  const handleDeleteQuestion = (elementId: string) => {
    if (editForm) {
      const updatedElements = editForm.elements.filter(
        (element) => element.id !== elementId,
      );

      setEditForm({
        ...editForm,
        elements: updatedElements,
      });
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedItem(elementId);
    // Set ghost drag image
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    if (draggedItem !== elementId) {
      setDragOverItem(elementId);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (
      editForm &&
      draggedItem &&
      dragOverItem &&
      draggedItem !== dragOverItem
    ) {
      // Reorder the elements
      const draggedItemIndex = editForm.elements.findIndex(
        (item) => item.id === draggedItem,
      );
      const dragOverItemIndex = editForm.elements.findIndex(
        (item) => item.id === dragOverItem,
      );

      if (draggedItemIndex !== -1 && dragOverItemIndex !== -1) {
        const newElements = [...editForm.elements];
        const draggedItemContent = newElements[draggedItemIndex];

        // Remove the dragged item
        newElements.splice(draggedItemIndex, 1);

        // Add it at the new position
        newElements.splice(dragOverItemIndex, 0, draggedItemContent);

        // Update the state
        setEditForm({
          ...editForm,
          elements: newElements,
        });
      }
    }

    // Reset drag state
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (editForm && selectedPage) {
      // Prepare the updated elements by removing the id property
      const updatedElements = editForm.elements.map((element) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = element;
        return rest;
      });

      // Create the updated page
      const updatedPage = {
        title: editForm.title,
        elements: updatedElements,
      };

      // Update the pages state
      const updatedPages = pages.map((page) =>
        page.id === selectedPage ? { ...updatedPage, id: page.id } : page,
      );

      // Update the state
      setPages(updatedPages);

      // Save to localStorage for persistence
      localStorage.setItem(
        QUESTIONNAIRE_STORAGE_KEY,
        JSON.stringify(updatedPages),
      );

      // Notify other components that the questionnaire has been updated
      notifyQuestionnaireUpdate();

      // In a real implementation, this would also save the changes to the backend
      console.log("Saving changes:", updatedPage);

      // Show success message
      setSuccessMessage(
        "Section updated successfully! Changes have been saved and will persist.",
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      // Exit edit mode
      setEditMode(false);
      setEditForm(null);
    }
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

  // Get type description for tooltips
  const getTypeDescription = (type: string) => {
    switch (type) {
      case "text":
        return "Single line text input - best for short answers";
      case "comment":
        return "Multi-line text input - best for longer responses";
      case "radiogroup":
        return "Multiple choice - user selects one option";
      case "checkbox":
        return "Checkboxes - user can select multiple options";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Success message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md animate-fade-in-out">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Pages list */}
      <div className="w-full md:w-1/4">
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
      <div className="w-full md:w-3/4">
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
                    <button
                      onClick={handleSaveChanges}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
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

            {editMode && editForm ? (
              <div className="space-y-6">
                <div className="mb-4">
                  <label
                    htmlFor="section-title"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Section Title
                  </label>
                  <input
                    type="text"
                    id="section-title"
                    value={editForm.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      Questions
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Drag questions to reorder
                    </p>
                  </div>

                  {editForm.elements.map((element) => (
                    <div
                      key={element.id}
                      className={`mb-6 p-4 border border-gray-200 rounded-lg dark:border-gray-700 cursor-move ${
                        draggedItem === element.id ? "opacity-50" : ""
                      } ${dragOverItem === element.id ? "border-blue-500 border-2" : ""}`}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, element.id)}
                      onDragOver={(e) => handleDragOver(e, element.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <svg
                            className="w-6 h-6 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 8h16M4 16h16"
                            ></path>
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Question {editForm.elements.indexOf(element) + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(element.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          aria-label="Delete question"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Question Text
                        </label>
                        <input
                          type="text"
                          value={element.title || ""}
                          onChange={(e) =>
                            handleElementChange(
                              element.id,
                              "title",
                              e.target.value,
                            )
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                      </div>

                      <div className="mb-3 grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Question Type
                          </label>
                          <div className="group">
                            <select
                              value={element.type}
                              onChange={(e) =>
                                handleElementChange(
                                  element.id,
                                  "type",
                                  e.target.value,
                                )
                              }
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            >
                              <option value="text">Text Input</option>
                              <option value="comment">Text Area</option>
                              <option value="radiogroup">
                                Multiple Choice
                              </option>
                              <option value="checkbox">Checkboxes</option>
                            </select>
                            <div className="hidden group-hover:block absolute z-10 w-64 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 top-full mt-1 left-0">
                              {getTypeDescription(element.type)}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Required
                          </label>
                          <select
                            value={element.isRequired ? "true" : "false"}
                            onChange={(e) =>
                              handleElementChange(
                                element.id,
                                "isRequired",
                                e.target.value === "true",
                              )
                            }
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>

                      {(element.type === "radiogroup" ||
                        element.type === "checkbox") && (
                        <div className="mb-3">
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Options
                          </label>

                          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            {/* Existing options as individual inputs with delete buttons */}
                            {element.choices ? (
                              <div className="space-y-2 mb-2">
                                {element.choices.map((choice, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-2"
                                  >
                                    <div className="flex-grow flex space-x-2">
                                      <input
                                        type="text"
                                        placeholder="Value"
                                        value={
                                          typeof choice === "object"
                                            ? choice.value
                                            : choice
                                        }
                                        onChange={(e) => {
                                          const newChoices = [
                                            ...(element.choices || []),
                                          ];
                                          if (typeof choice === "object") {
                                            newChoices[idx] = {
                                              ...choice,
                                              value: e.target.value,
                                            };
                                          } else {
                                            newChoices[idx] = e.target.value;
                                          }
                                          handleElementChange(
                                            element.id,
                                            "choices",
                                            newChoices,
                                          );
                                        }}
                                        className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                      />

                                      {typeof choice === "object" && (
                                        <input
                                          type="text"
                                          placeholder="Display Text"
                                          value={choice.text}
                                          onChange={(e) => {
                                            const newChoices = [
                                              ...(element.choices || []),
                                            ];
                                            newChoices[idx] = {
                                              ...(newChoices[
                                                idx
                                              ] as ChoiceItem),
                                              text: e.target.value,
                                            };
                                            handleElementChange(
                                              element.id,
                                              "choices",
                                              newChoices,
                                            );
                                          }}
                                          className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        />
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newChoices = [
                                          ...(element.choices || []),
                                        ];
                                        newChoices.splice(idx, 1);
                                        handleElementChange(
                                          element.id,
                                          "choices",
                                          newChoices,
                                        );
                                      }}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M6 18L18 6M6 6l12 12"
                                        ></path>
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {/* Add option button */}
                            <button
                              type="button"
                              onClick={() => {
                                const newChoices = [...(element.choices || [])];

                                // Use object form by default for better UX
                                newChoices.push({
                                  value: `option${newChoices.length + 1}`,
                                  text: `Option ${newChoices.length + 1}`,
                                });

                                handleElementChange(
                                  element.id,
                                  "choices",
                                  newChoices,
                                );
                              }}
                              className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              Add Option
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Description (optional)
                        </label>
                        <textarea
                          value={element.description || ""}
                          onChange={(e) =>
                            handleElementChange(
                              element.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          rows={2}
                          placeholder="Add description or instructions for this question"
                        />
                      </div>

                      {/* Conditional logic section */}
                      {editForm.elements.length > 1 && (
                        <div className="mb-3">
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Conditional Display (optional)
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Show this question only if
                            </span>
                            <select
                              value={
                                element.visibleIf
                                  ? (element.visibleIf.match(/{([^}]+)}/) || [
                                      "",
                                      "",
                                    ])[1]
                                  : ""
                              }
                              onChange={(e) => {
                                const selectedValue = e.target.value;
                                if (selectedValue === "") {
                                  // Clear the condition when "None" is selected
                                  handleElementChange(
                                    element.id,
                                    "visibleIf",
                                    "",
                                  );
                                } else {
                                  // Set the condition using the selected question name
                                  handleElementChange(
                                    element.id,
                                    "visibleIf",
                                    `{${selectedValue}} = 'yes'`,
                                  );
                                }
                              }}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="">None (no condition)</option>
                              {editForm.elements
                                .filter((el) => el.id !== element.id && el.name)
                                .map((el) => (
                                  <option key={el.id} value={el.name || ""}>
                                    {el.title || el.name || "Unnamed question"}
                                  </option>
                                ))}
                            </select>
                          </div>
                          {element.visibleIf && (
                            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">
                                  Active condition:
                                </span>{" "}
                                {element.visibleIf}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                This question will only be shown when the
                                selected question is answered with "yes"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                      </svg>
                      Add New Question
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPageObj?.elements.map((element, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                        {element.title}
                      </h4>
                      {/* Make all badges consistent width using min-width */}
                      <span className="text-xs px-2 py-1 min-w-[100px] text-center bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
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
                            (
                              choice: string | ChoiceItem,
                              choiceIndex: number,
                            ) => (
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
    </div>
  );
};

export default AdminQuestionnaire;
