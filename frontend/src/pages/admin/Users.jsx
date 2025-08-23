import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/customAxios.js";
import { useToast } from "../../contexts/toast.context.jsx";

const roleLabels = { user: "Người dùng", admin: "Quản trị" };

const Users = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers((res.data || []).filter((u) => u.role !== "admin"));
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term)
    );
  }, [users, q]);

  const setActive = async (id, isActive) => {
    try {
      await api.put(`/users/${id}/active`, { isActive });
      fetchUsers();
      toast.success(isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Không thể thay đổi trạng thái tài khoản");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Xóa người dùng này?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
      toast.success("Đã xóa người dùng");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Xóa người dùng thất bại");
    }
  };

  const openDetail = async (id) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await api.get(`/users/${id}`);
      setDetailUser(res.data || null);
    } catch (e) {
      console.error(e);
      setDetailUser(null);
      toast.error(e?.response?.data?.message || "Không thể tải chi tiết người dùng");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailUser(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>

      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, phone"
          className="input input-bordered w-full max-w-md"
        />
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="card-stable p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-parchment/60">
                <tr className="text-left">
                  <th className="p-2">Tên</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Vai trò</th>
                  <th className="p-2">Trạng thái</th>
                  <th className="p-2">Ngày tạo</th>
                  <th className="p-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.length > 0 ? filtered.map((u) => (
                  <tr key={u._id} className="border-t">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{roleLabels[u.role] || u.role}</td>
                    <td className="p-2">
                      {u.isActive ? (
                        <span className="text-green-600">Hoạt động</span>
                      ) : (
                        <span className="text-red-600">Đã khóa</span>
                      )}
                    </td>
                    <td className="p-2">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="p-2 space-x-2">
                      {/* Active toggle */}
                      {u.isActive ? (
                        <button
                          className="btn-outline mr-2 mb-2"
                          onClick={() => setActive(u._id, false)}
                        >
                          Khóa
                        </button>
                      ) : (
                        <button
                          className="btn-outline mr-2 mb-2"
                          onClick={() => setActive(u._id, true)}
                        >
                          Mở khóa
                        </button>
                      )}

                      {/* Details */}
                      <button
                        className="btn-outline mr-2 mb-2"
                        onClick={() => openDetail(u._id)}
                      >
                        Chi tiết
                      </button>

                      {/* Delete */}
                      <button
                        className="btn-outline mr-2 mb-2 text-red-600"
                        onClick={() => removeUser(u._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-2 text-center">
                      Không có người dùng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chi tiết người dùng</h2>
              <button className="btn-outline" onClick={closeDetail}>Đóng</button>
            </div>
            {detailLoading ? (
              <div>Đang tải...</div>
            ) : !detailUser ? (
              <div>Không thể tải chi tiết</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {detailUser.avatar ? (
                    <img src={detailUser.avatar} alt={detailUser.name} className="h-14 w-14 rounded-full object-cover border" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-parchment border" />
                  )}
                  <div>
                    <div className="text-base font-medium">{detailUser.name}</div>
                    <div className="text-sm text-muted">{detailUser.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted">Số điện thoại</div>
                    <div>{detailUser.phone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted">Vai trò</div>
                    <div>{roleLabels[detailUser.role] || detailUser.role}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted">Địa chỉ</div>
                    <div>{detailUser.address || '—'}</div>
                    <div>{[detailUser.city, detailUser.zipCode].filter(Boolean).join(' ')}</div>
                  </div>
                  <div>
                    <div className="text-muted">Trạng thái</div>
                    <div>{detailUser.isActive ? 'Hoạt động' : 'Đã khóa'}</div>
                  </div>
                  <div>
                    <div className="text-muted">Xác thực email</div>
                    <div>{detailUser.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</div>
                  </div>
                  <div>
                    <div className="text-muted">Ngày tạo</div>
                    <div>{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString() : ''}</div>
                  </div>
                  <div>
                    <div className="text-muted">Cập nhật</div>
                    <div>{detailUser.updatedAt ? new Date(detailUser.updatedAt).toLocaleString() : ''}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
