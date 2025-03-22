import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "orange";
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
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
    yellow:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
    red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
  };

  return (
    <div
      className={`
        p-4 bg-white border border-gray-200 rounded-lg shadow-sm 
        dark:border-gray-700 dark:bg-gray-800
        ${clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
      `}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center">
        <div className={`p-3 mr-4 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
