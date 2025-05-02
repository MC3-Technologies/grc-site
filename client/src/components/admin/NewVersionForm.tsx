import { useState } from "react";
import { VersionMetadata } from "../../utils/questionnaireUtils";

interface NewVersionFormProps {
  onSubmit: (metadata: VersionMetadata) => void;
  onCancel: () => void;
  currentVersion?: string;
  isSubmitting: boolean;
}

const NewVersionForm: React.FC<NewVersionFormProps> = ({
  onSubmit,
  onCancel,
  currentVersion,
  isSubmitting,
}) => {
  const defaultVersion = currentVersion
    ? (parseFloat(currentVersion) + 0.1).toFixed(1)
    : "1.0";

  const [formData, setFormData] = useState<VersionMetadata>({
    version: defaultVersion,
    lastUpdated: new Date().toISOString(),
    updatedBy: "admin", // This could be fetched from the current user's info
    changeNotes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure the version is explicitly set for new version creation
    onSubmit({
      ...formData,
      lastUpdated: new Date().toISOString(), // Update timestamp
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Create New Version
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="version"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Version Number
          </label>
          <input
            type="text"
            id="version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            required
            pattern="^\d+(\.\d+)?$"
            title="Please enter a valid version number (e.g., 1.0, 2.1)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Use semantic versioning (e.g., 1.0, 1.1, 2.0)
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="updatedBy"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Author
          </label>
          <input
            type="text"
            id="updatedBy"
            name="updatedBy"
            value={formData.updatedBy}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="changeNotes"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Change Notes
          </label>
          <textarea
            id="changeNotes"
            name="changeNotes"
            value={formData.changeNotes}
            onChange={handleChange}
            rows={4}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            placeholder="Describe the changes in this version..."
            required
          ></textarea>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Version"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewVersionForm;
