import React from 'react';

const InfoCard = ({
  icon: Icon,
  label,
  value,
  bgGradient = "from-blue-50 to-indigo-100",
  borderColor = "border-blue-200",
  iconBg = "bg-blue-500",
  labelColor = "text-blue-700",
  className = ""
}) => {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} p-6 rounded-2xl border ${borderColor} hover:shadow-lg transition-all duration-300 group ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconBg} text-white rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="text-lg" />
        </div>
        <div>
          <label className={`block ${labelColor} text-sm font-semibold mb-1`}>{label}</label>
          <p className="text-ink text-lg font-medium">
            {value || "Chưa cập nhật"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
