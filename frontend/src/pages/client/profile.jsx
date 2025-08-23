import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/auth.context";
import api from "../../utils/customAxios";
import InfoCard from "../../components/InfoCard";
import AddressCard from "../../components/AddressCard";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaExclamationCircle, FaEdit, FaCog, FaLock, FaCamera, FaHome, FaArrowLeft } from "react-icons/fa";

const defaultAvatar = "/default-avatar.svg"; // Default avatar path

export default function Profile() {
  const { currentUser, setCurrentUser, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [userAvatar, setUserAvatar] = useState("");



  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Update form and avatar when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        city: currentUser.city || "",
        zipCode: currentUser.zipCode || "",
      });
      // Update avatar state
      setUserAvatar(currentUser.avatar || defaultAvatar);
      setIsLoadingUserInfo(false);
    }
  }, [currentUser]);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Vui lòng chọn file ảnh hợp lệ');
      setMessageType('error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Kích thước file không được vượt quá 5MB');
      setMessageType('error');
      return;
    }

    setAvatarLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh user data
      await fetchProfile();
      setMessage('Cập nhật ảnh đại diện thành công!');
      setMessageType('success');
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện'
      );
      setMessageType('error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.put("/auth/profile", {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        zipCode: profileForm.zipCode,
      });

      // Refresh user data from server
      await fetchProfile();
      setMessage("Cập nhật thông tin thành công!");
      setMessageType("success");
      setIsEditing(false); // Exit edit mode after successful update
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setMessage("Đổi mật khẩu thành công!");
      setMessageType("success");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    if (!isLoadingUserInfo) {
      return (
        <div className="bg-gradient-to-br from-parchment to-gray-100 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <FaUser className="mx-auto text-accent text-6xl mb-4 opacity-50" />
              <p className="text-ink text-lg font-medium mb-6">Vui lòng đăng nhập để xem thông tin cá nhân</p>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-accent to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <FaUser />
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-gradient-to-br from-parchment to-gray-100 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-ink text-lg font-medium">Đang tải thông tin người dùng...</p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen p-4"
      style={{
        backgroundImage: `url("/banner.png")`,
        backgroundSize: "cover",
        backgroundRepeat: "repeat-y",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Return to Home Button & Breadcrumb */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-ink px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group backdrop-blur-sm border border-gray-200"
          >
            <FaArrowLeft className="text-accent group-hover:-translate-x-1 transition-transform duration-300" />
            <FaHome className="text-accent" />
            Về trang chủ
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-muted">
            <button
              onClick={() => navigate('/')}
              className="hover:text-accent transition-colors duration-300"
            >
              Trang chủ
            </button>
            <span className="mx-2">•</span>
            <span className="text-accent font-medium">Thông tin cá nhân</span>
          </nav>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white/95 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">

          {/* Content Area */}
          <div className="p-8">{/* Enhanced Message Display */}
            {message && (
              <div className={`p-4 rounded-xl mb-6 font-medium border-l-4 transform transition-all duration-300 ${messageType === "success"
                ? "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-400 shadow-green-100"
                : "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-400 shadow-red-100"
                } shadow-lg`}>
                <div className="flex items-center gap-3">
                  {messageType === "success" ?
                    <FaCheckCircle className="text-green-600" /> :
                    <FaExclamationCircle className="text-red-600" />
                  }
                  {message}
                </div>
              </div>
            )}
            {/* Profile Header with Gradient Background */}
            <div className="bg-gradient-to-r from-accent to-accent-600 px-8 py-12 relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Enhanced Avatar Section */}
                <div className="relative group">
                  <div className="relative">
                    <img
                      src={userAvatar}
                      alt="Avatar"
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-white/30 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = defaultAvatar;
                      }}
                    />
                    {/* Avatar Upload Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                      <label htmlFor="avatar-upload" className="cursor-pointer text-white text-center">
                        <FaCamera className="text-2xl mb-2 mx-auto" />
                        <span className="text-sm font-medium block">
                          {avatarLoading ? 'Đang tải...' : 'Đổi ảnh'}
                        </span>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={avatarLoading}
                      />
                    </div>
                    {avatarLoading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  {/* Online Status Indicator */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center md:text-left text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-md">
                    {currentUser.name}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-white/90 text-lg mb-4">
                    <FaEnvelope className="text-sm" />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                      <FaUser className="text-xs" />
                      {currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${currentUser.isEmailVerified
                      ? 'bg-green-500/20 text-green-100'
                      : 'bg-orange-500/20 text-orange-100'
                      }`}>
                      {currentUser.isEmailVerified ? <FaCheckCircle className="text-xs" /> : <FaExclamationCircle className="text-xs" />}
                      {currentUser.isEmailVerified ? 'Email đã xác thực' : 'Chưa xác thực email'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
              <button
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${activeTab === "profile"
                  ? "text-accent border-accent"
                  : "text-muted border-transparent hover:text-accent"
                  }`}
                onClick={() => setActiveTab("profile")}
              >
                Thông tin cá nhân
              </button>
              <button
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${activeTab === "password"
                  ? "text-accent border-accent"
                  : "text-muted border-transparent hover:text-accent"
                  }`}
                onClick={() => setActiveTab("password")}
              >
                Đổi mật khẩu
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg mb-6 font-medium ${messageType === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
                }`}>
                {message}
              </div>
            )}

            {/* Profile Form */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {!isEditing ? (
                  // Enhanced View Mode - Display basic information
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-ink text-2xl font-bold flex items-center gap-3">
                        <FaUser className="text-accent" />
                        Thông tin cá nhân
                      </h3>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-accent to-accent-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      >
                        <FaEdit className="text-sm" />
                        Chỉnh sửa
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name Card */}
                      <InfoCard
                        icon={FaUser}
                        label="Họ và tên"
                        value={currentUser?.name}
                        bgGradient="from-blue-50 to-indigo-100"
                        borderColor="border-blue-200"
                        iconBg="bg-blue-500"
                        labelColor="text-blue-700"
                      />

                      {/* Email Card */}
                      <InfoCard
                        icon={FaEnvelope}
                        label="Email"
                        value={currentUser?.email || "Chưa có email"}
                        bgGradient="from-blue-50 to-indigo-100"
                        borderColor="border-blue-200"
                        iconBg="bg-blue-500"
                        labelColor="text-blue-700"
                      />

                      {/* Phone Card */}
                      <InfoCard
                        icon={FaPhone}
                        label="Số điện thoại"
                        value={currentUser?.phone}
                        bgGradient="from-blue-50 to-indigo-100"
                        borderColor="border-blue-200"
                        iconBg="bg-blue-500"
                        labelColor="text-blue-700"
                      />

                      {/* Role Card */}
                      <InfoCard
                        icon={FaCog}
                        label="Vai trò"
                        value={currentUser?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        bgGradient="from-blue-50 to-cyan-100"
                        borderColor="border-blue-200"
                        iconBg="bg-blue-500"
                        labelColor="text-blue-700"
                      />
                    </div>

                    {/* Address Card - Full Width */}
                    <AddressCard
                      icon={FaMapMarkerAlt}
                      label="Địa chỉ"
                      value={[currentUser?.address, currentUser?.city, currentUser?.zipCode].filter(Boolean).join(', ')}
                      bgGradient="from-teal-50 to-cyan-100"
                      borderColor="border-teal-200"
                      iconBg="bg-teal-500"
                      labelColor="text-teal-700"
                    />

                    {/* City and Zip Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoCard
                        icon={FaMapMarkerAlt}
                        label="Thành phố"
                        value={currentUser?.city}
                      />
                      <InfoCard
                        icon={FaMapMarkerAlt}
                        label="Mã bưu chính"
                        value={currentUser?.zipCode}
                      />
                    </div>

                    {/* Additional Info Cards */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Join Date Card */}
                      <InfoCard
                        icon={FaCalendarAlt}
                        label="Ngày tham gia"
                        value={currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString("vi-VN") : "Không xác định"}
                        bgGradient="from-blue-50 to-indigo-100"
                        borderColor="border-indigo-200"
                        iconBg="bg-blue-500"
                        labelColor="text-blue-700"
                      />

                      {/* Email Status Card */}
                      <InfoCard
                        icon={currentUser?.isEmailVerified ? FaCheckCircle : FaExclamationCircle}
                        label="Trạng thái email"
                        value={currentUser?.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
                        bgGradient={currentUser?.isEmailVerified
                          ? "from-green-50 to-emerald-100"
                          : "from-orange-50 to-amber-100"
                        }
                        borderColor={currentUser?.isEmailVerified
                          ? "border-green-200"
                          : "border-orange-200"
                        }
                        iconBg={currentUser?.isEmailVerified ? "bg-green-500" : "bg-orange-500"}
                        labelColor={currentUser?.isEmailVerified
                          ? "text-green-700"
                          : "text-orange-700"
                        }
                      />
                    </div>
                  </div>
                ) : (
                  // Enhanced Edit Mode - Show form
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl border-2 border-dashed border-gray-300">
                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-ink text-2xl font-bold flex items-center gap-3">
                          <FaEdit className="text-accent" />
                          Chỉnh sửa thông tin
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setMessage("");
                            // Reset form to current user data
                            setProfileForm({
                              name: currentUser?.name || "",
                              email: currentUser?.email || "",
                              phone: currentUser?.phone || "",
                              address: currentUser?.address || "",
                              city: currentUser?.city || "",
                              zipCode: currentUser?.zipCode || "",
                            });
                          }}
                          className="text-muted hover:text-red-500 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50"
                        >
                          <span>✕</span>
                          Hủy
                        </button>
                      </div>

                      {/* Enhanced Avatar Upload Section */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-ink font-semibold text-lg mb-4 flex items-center gap-2">
                          <FaCamera className="text-accent" />
                          Ảnh đại diện
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <img
                              src={userAvatar}
                              alt="Avatar"
                              className="w-20 h-20 rounded-full object-cover border-3 border-gray-300 shadow-md"
                              onError={(e) => {
                                e.target.src = defaultAvatar;
                              }}
                            />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                              <FaCamera className="text-white text-xs" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor="avatar-upload-edit"
                              className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-ink px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 inline-flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                            >
                              <FaCamera />
                              {avatarLoading ? 'Đang tải lên...' : 'Chọn ảnh mới'}
                            </label>
                            <input
                              id="avatar-upload-edit"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              disabled={avatarLoading}
                            />
                            <p className="text-muted text-sm mt-2 flex items-center gap-2">
                              <span>📷</span>
                              Định dạng: JPG, PNG. Tối đa 5MB.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div className="space-y-3">
                          <label htmlFor="name" className="flex text-ink font-semibold text-lg items-center gap-2">
                            <FaUser className="text-accent" />
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            required
                            className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-3">
                          <label htmlFor="email" className="text-ink font-semibold text-lg flex items-center gap-2">
                            <FaEnvelope className="text-accent" />
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={profileForm.email}
                            disabled
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-muted cursor-not-allowed"
                          />
                          <small className="text-muted text-sm flex items-center gap-1">
                            🔒 Email không thể thay đổi
                          </small>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-3">
                          <label htmlFor="phone" className="text-ink font-semibold text-lg flex items-center gap-2">
                            <FaPhone className="text-accent" />
                            Số điện thoại
                          </label>
                          <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          />
                        </div>
                      </div>

                      {/* Address Field - Full Width */}
                      <div className="space-y-3">
                        <label htmlFor="address" className="text-ink font-semibold text-lg flex items-center gap-2">
                          <FaMapMarkerAlt className="text-accent" />
                          Địa chỉ
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          value={profileForm.address}
                          onChange={handleProfileChange}
                          rows="4"
                          className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 resize-none bg-white shadow-sm hover:shadow-md"
                          placeholder="Nhập địa chỉ của bạn..."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div className="space-y-3">
                            <label htmlFor="city" className="text-ink font-semibold text-lg">Thành phố</label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={profileForm.city}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                            />
                          </div>
                          <div className="space-y-3">
                            <label htmlFor="zipCode" className="text-ink font-semibold text-lg">Mã bưu chính</label>
                            <input
                              type="text"
                              id="zipCode"
                              name="zipCode"
                              value={profileForm.zipCode}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-accent to-accent-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 flex-1 justify-center"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Đang cập nhật...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle />
                              Cập nhật thông tin
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setMessage("");
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                        >
                          ✕ Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )
            }

            {/* Enhanced Password Form */}
            {
              activeTab === "password" && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl border-2 border-dashed border-gray-300">
                  <form onSubmit={handlePasswordSubmit} className="space-y-8">
                    <div className="text-center mb-8">
                      <h3 className="text-ink text-2xl font-bold flex items-center justify-center gap-3 mb-2">
                        <FaLock className="text-accent" />
                        Đổi mật khẩu
                      </h3>
                      <p className="text-muted">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label htmlFor="currentPassword" className="text-ink font-semibold text-lg mb-3 flex items-center gap-2">
                          <FaLock className="text-accent" />
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label htmlFor="newPassword" className="text-ink font-semibold text-lg mb-3 flex items-center gap-2">
                          <FaLock className="text-green-500" />
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength="6"
                          className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        />
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label htmlFor="confirmPassword" className="text-ink font-semibold text-lg mb-3 flex items-center gap-2">
                          <FaCheckCircle className="text-green-500" />
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength="6"
                          className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-accent to-accent-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang đổi mật khẩu...
                        </>
                      ) : (
                        <>
                          <FaLock />
                          Đổi mật khẩu
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )
            }
          </div >
        </div >
      </div >
    </div >
  );
}
