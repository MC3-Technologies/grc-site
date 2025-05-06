import { useEffect, useState } from "react";
import {
  fetchSystemSettings,
  updateSystemSettings,
  SystemSetting,
  SystemSettingValue,
} from "../../utils/adminUser";
import { toast } from "react-hot-toast";
import { AuthUser } from "aws-amplify/auth";

interface AdminSystemSettingsProps {
  currentUser?: AuthUser | null;
}

export default function AdminSystemSettings({
  currentUser,
}: AdminSystemSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsByCategory, setSettingsByCategory] = useState<
    Record<string, SystemSetting[]>
  >({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [editingSettings, setEditingSettings] = useState<
    Record<string, SystemSetting>
  >({});

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Function to fetch settings from API
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemSettings();

      // Ensure data.settings exists and is an array
      const settingsArray = Array.isArray(data.settings) ? data.settings : [];
      setSettings(settingsArray);

      // Ensure settingsByCategory exists and is an object
      const categoryMap = data.settingsByCategory || {};
      setSettingsByCategory(categoryMap);

      // Initialize editing state with copies of the settings
      const editingMap: Record<string, SystemSetting> = {};
      settingsArray.forEach((setting) => {
        editingMap[setting.id] = { ...setting };
      });
      setEditingSettings(editingMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load system settings");

      // Set defaults in case of error
      setSettings([]);
      setSettingsByCategory({});
      setEditingSettings({});
    } finally {
      setLoading(false);
    }
  };

  // Get the settings to display based on active category
  const getDisplaySettings = () => {
    if (activeCategory === "all") {
      return settings;
    }
    return settingsByCategory[activeCategory] || [];
  };

  // Handle value change for a setting
  const handleSettingChange = (settingId: string, value: unknown) => {
    setEditingSettings((prev) => ({
      ...prev,
      [settingId]: {
        ...prev[settingId],
        value: value as SystemSettingValue,
      },
    }));
  };

  // Save a single setting
  const saveSetting = async (settingId: string) => {
    try {
      const setting = editingSettings[settingId];
      const result = await updateSystemSettings(setting, currentUser?.username);

      if (result.success) {
        toast.success(`Setting "${setting.name}" updated successfully`);
        // Refresh settings to get latest values
        fetchSettings();
      } else {
        toast.error(`Failed to update setting: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("An error occurred while saving the setting");
    }
  };

  // Reset a single setting to its original value
  const resetSetting = (settingId: string) => {
    const originalSetting = settings.find((s) => s.id === settingId);
    if (originalSetting) {
      setEditingSettings((prev) => ({
        ...prev,
        [settingId]: { ...originalSetting },
      }));
    }
  };

  // Render a setting based on its value type
  const renderSettingInput = (setting: SystemSetting) => {
    const currentValue = editingSettings[setting.id]?.value;

    // If value is a boolean
    if (typeof currentValue === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue}
              onChange={(e) =>
                handleSettingChange(setting.id, e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {currentValue ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
      );
    }

    // If value is a number
    if (typeof currentValue === "number") {
      return (
        <input
          type="number"
          value={currentValue}
          onChange={(e) =>
            handleSettingChange(setting.id, Number(e.target.value))
          }
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      );
    }

    // If value is a string
    if (typeof currentValue === "string") {
      // For longer text, use textarea
      if (currentValue.length > 100) {
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            rows={4}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      }

      // For shorter text, use input
      return (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      );
    }

    // For objects or arrays, use a textarea with JSON
    if (typeof currentValue === "object") {
      return (
        <textarea
          value={JSON.stringify(currentValue, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleSettingChange(setting.id, parsed);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              // Allow invalid JSON during editing, but don't update the value
              //console.log("Invalid JSON, not updating value");
            }
          }}
          rows={8}
          className="font-mono text-sm block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      );
    }

    // Fallback for other types
    return (
      <div className="text-sm text-gray-500">
        Value type not supported for direct editing: {typeof currentValue}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get unique categories - ensure settingsByCategory is an object
  const categories = settingsByCategory ? Object.keys(settingsByCategory) : [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">System Settings</h1>

      {/* Error message if no settings found */}
      {!loading && settings.length === 0 && (
        <div
          className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
            </svg>
            <span className="font-medium">No system settings found.</span>
          </div>
          <div className="mt-2">
            This could be because no settings have been configured yet, or there
            was an error fetching settings from the server.
          </div>
          <button
            onClick={fetchSettings}
            className="mt-2 px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            Refresh Settings
          </button>
        </div>
      )}

      {/* Only show tabs and settings if we have data */}
      {settings.length > 0 && (
        <>
          {/* Category tabs */}
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-flex items-center justify-center p-4 py-2 px-3 ${
                    activeCategory === "all"
                      ? "text-white bg-blue-600 dark:text-white rounded-t-lg"
                      : "text-white bg-gray-700 hover:text-gray-300 dark:hover:text-gray-300 rounded-t-lg"
                  }`}
                  onClick={() => setActiveCategory("all")}
                >
                  All Settings
                  <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    {settings.length}
                  </span>
                </button>
              </li>
              {categories.map((category) => (
                <li key={category} className="mr-2">
                  <button
                    className={`inline-flex items-center justify-center p-4 py-2 px-3 ${
                      activeCategory === category
                        ? "text-white bg-blue-600 dark:text-white rounded-t-lg"
                        : "text-white bg-gray-700 hover:text-gray-300 dark:hover:text-gray-300 rounded-t-lg"
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                      {settingsByCategory[category]?.length || 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings list */}
          <div className="grid grid-cols-1 gap-6">
            {getDisplaySettings().map((setting) => {
              const currentValue = editingSettings[setting.id]?.value;
              const originalValue = settings.find(
                (s) => s.id === setting.id,
              )?.value;

              return (
                <div
                  key={setting.id}
                  className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {setting.name}
                      </h2>
                      {setting.category && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                          {setting.category}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {currentValue !== originalValue && (
                        <>
                          <button
                            onClick={() => resetSetting(setting.id)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveSetting(setting.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                          >
                            Save
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {setting.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {setting.description}
                    </p>
                  )}

                  <div className="mt-4">{renderSettingInput(setting)}</div>

                  {setting.lastUpdated && (
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Last updated:{" "}
                      {new Date(setting.lastUpdated).toLocaleString()}
                      {setting.updatedBy && ` by ${setting.updatedBy}`}
                    </div>
                  )}
                </div>
              );
            })}

            {getDisplaySettings().length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">
                  No settings found in this category.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
