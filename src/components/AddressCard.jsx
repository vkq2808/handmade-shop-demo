import React from 'react';

const AddressCard = ({
  icon: Icon,
  label,
  value,
  bgGradient = "from-teal-50 to-cyan-100",
  borderColor = "border-teal-200",
  iconBg = "bg-teal-500",
  labelColor = "text-teal-700"
}) => {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} p-6 rounded-2xl border ${borderColor} hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 ${iconBg} text-white rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
          <Icon className="text-lg" />
        </div>
        <div className="flex-1">
          <label className={`block ${labelColor} text-sm font-semibold mb-2`}>{label}</label>
          <p className="text-ink text-lg font-medium leading-relaxed">
            {value || "Chưa cập nhật"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
