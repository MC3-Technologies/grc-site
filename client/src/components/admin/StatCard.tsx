import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  clickable?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  onClick,
  clickable = false,
}) => {
  const getColorClass = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case "green":
        return "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300";
      case "red":
        return "bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300";
      case "yellow":
        return "bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300";
      case "orange":
        return "bg-orange-50 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
      case "purple":
        return "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
        clickable
          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          : ""
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center">
        <div
          className={`p-2 mr-4 rounded-full ${getColorClass(color)}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
