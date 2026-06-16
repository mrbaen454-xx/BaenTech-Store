import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Moon,
  Package,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Tag,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getAdminProfileApi,
  updateAdminProfileApi,
} from "../../api/profileApi";

const saveAdminProfileToStorage = (data) => {
  const normalizedProfile = {
    fullName: data?.fullName || data?.name || "",
    email: data?.email || "",
    role: data?.role || "ADMIN",
    enabled: data?.enabled ?? true,
    phoneNumber: data?.phoneNumber || data?.phone || data?.noHp || "",
    address: data?.address || data?.alamat || "",
    gender: data?.gender || "",
    birthDate: data?.birthDate || data?.tanggalLahir || "",
    profileImageUrl:
      data?.profileImageUrl || data?.imageUrl || data?.photo || "",
  };

  localStorage.setItem("adminProfile", JSON.stringify(normalizedProfile));
};
function AdminProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "ADMIN",
    enabled: true,
    phoneNumber: "",
    address: "",
    gender: "",
    birthDate: "",
    profileImageUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");

  const menus = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/admin/dashboard",
      path: "/admin/dashboard",
    },
    {
      name: "Products",
      icon: Package,
      active: location.pathname.startsWith("/admin/products"),
      path: "/admin/products",
    },
    {
      name: "Categories",
      icon: Tag,
      active: location.pathname === "/admin/categories",
      path: "/admin/categories",
    },
    {
      name: "Orders",
      icon: ShoppingBag,
      active: location.pathname === "/admin/orders",
      path: "/admin/orders",
    },
    {
      name: "Payments",
      icon: CreditCard,
      active: location.pathname === "/admin/payments",
      path: "/admin/payments",
    },
    {
      name: "Customers",
      icon: Users,
      active: location.pathname === "/admin/customers",
      path: "/admin/customers",
    },
    {
      name: "Finance",
      icon: Wallet,
      active: location.pathname === "/admin/finance",
      path: "/admin/finance",
    },
    {
      name: "Reports",
      icon: BarChart3,
      active: location.pathname === "/admin/reports",
      path: "/admin/reports",
    },
  ];

  const adminName =
    form.fullName ||
    profile?.fullName ||
    profile?.name ||
    user?.fullName ||
    user?.name ||
    user?.email ||
    "Admin";

  const adminEmail = form.email || profile?.email || user?.email || "-";
  const adminRole = form.role || profile?.role || user?.role || "ADMIN";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const data = await getAdminProfileApi();

        setProfile(data);
        saveAdminProfileToStorage(data);

        setForm({
          fullName: data?.fullName || data?.name || user?.fullName || "",
          email: data?.email || user?.email || "",
          role: data?.role || user?.role || "ADMIN",
          enabled: data?.enabled ?? true,
          phoneNumber: data?.phoneNumber || data?.phone || data?.noHp || "",
          address: data?.address || data?.alamat || "",
          gender: data?.gender || "",
          birthDate: data?.birthDate || data?.tanggalLahir || "",
          profileImageUrl:
            data?.profileImageUrl || data?.imageUrl || data?.photo || "",
        });
      } catch (err) {
        console.log(err);

        setForm((prev) => ({
          ...prev,
          fullName: user?.fullName || user?.name || "",
          email: user?.email || "",
          role: user?.role || "ADMIN",
          enabled: true,
        }));

        setError(
          err.response?.data?.message ||
            "Profile belum tersedia. Silakan lengkapi lalu simpan.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Foto profile harus berformat JPG, PNG, atau WEBP.");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB

    if (file.size > maxSize) {
      setError("Ukuran foto profile maksimal 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        profileImageUrl: reader.result,
      }));

      setSelectedImageName(file.name);
      setError("");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        gender: form.gender,
        birthDate: form.birthDate,
        profileImageUrl: form.profileImageUrl,
      };

      const updatedProfile = await updateAdminProfileApi(payload);

      setProfile(updatedProfile);
      saveAdminProfileToStorage(updatedProfile);

      setForm({
        fullName:
          updatedProfile?.fullName ||
          updatedProfile?.name ||
          form.fullName ||
          "",
        email: updatedProfile?.email || form.email || "",
        role: updatedProfile?.role || form.role || "ADMIN",
        enabled: updatedProfile?.enabled ?? form.enabled ?? true,
        phoneNumber:
          updatedProfile?.phoneNumber ||
          updatedProfile?.phone ||
          form.phoneNumber ||
          "",
        address:
          updatedProfile?.address ||
          updatedProfile?.alamat ||
          form.address ||
          "",
        gender: updatedProfile?.gender || form.gender || "",
        birthDate:
          updatedProfile?.birthDate ||
          updatedProfile?.tanggalLahir ||
          form.birthDate ||
          "",
        profileImageUrl:
          updatedProfile?.profileImageUrl ||
          updatedProfile?.imageUrl ||
          updatedProfile?.photo ||
          form.profileImageUrl ||
          "",
      });

      setSuccess("Profile admin berhasil disimpan.");
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
          "Gagal menyimpan perubahan profile admin.",
      );
    } finally {
      setSaving(false);
    }
  };

  const SidebarContent = () => {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-6">
          <div className="inline-flex cursor-default select-none">
            <img
              src={logo}
              alt="BaenTech Store"
              className="h-16 w-auto object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-2 px-4">
          {menus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.name}
                to={menu.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  menu.active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-400"
                }`}
              >
                <Icon size={21} />
                <span>{menu.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={21} />
            Logout
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 bg-white transition duration-300 dark:border-slate-800 dark:bg-slate-900 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="lg:ml-72">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="sticky top-3 z-30 rounded-[2rem] border border-slate-200 bg-white/85 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <h1 className="text-xl font-black text-slate-950 dark:text-white">
                    Profile Admin
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Profile
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-yellow-300"
                >
                  {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
                </button>

                <div className="hidden items-center gap-3 rounded-full border border-blue-300 bg-blue-50 py-1.5 pl-2 pr-4 dark:border-blue-700 dark:bg-blue-950/30 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/50">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {adminName}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Administrator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-100 px-5 py-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl bg-green-100 px-5 py-4 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {success}
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.7fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {form.profileImageUrl ? (
                    <img
                      src={form.profileImageUrl}
                      alt={adminName}
                      className="h-36 w-36 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <UserRound size={72} />
                    </div>
                  )}

                  <label className="absolute bottom-2 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                    <Camera size={20} />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
                  {loading ? "Memuat..." : adminName}
                </h2>

                <p className="mt-2 rounded-full bg-blue-50 px-4 py-1 text-sm font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  {adminRole}
                </p>
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
                <ProfileInfo
                  icon={Mail}
                  label="Email"
                  value={loading ? "Memuat..." : adminEmail}
                />

                <ProfileInfo
                  icon={Phone}
                  label="No. Telepon"
                  value={loading ? "Memuat..." : form.phoneNumber || "-"}
                />

                <ProfileInfo
                  icon={MapPin}
                  label="Alamat"
                  value={loading ? "Memuat..." : form.address || "-"}
                />

                <ProfileInfo
                  icon={ShieldCheck}
                  label="Role"
                  value={loading ? "Memuat..." : adminRole}
                />

                <ProfileInfo
                  icon={CheckCircle2}
                  label="Status"
                  value={form.enabled ? "Akun Aktif" : "Akun Nonaktif"}
                />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                  <UserRound size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Informasi Profile
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Data ini tersimpan di user-service.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <FormField label="Nama Lengkap">
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="admin-input"
                    placeholder="Nama lengkap admin"
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="admin-input cursor-not-allowed opacity-80"
                  />
                </FormField>

                <FormField label="No. Telepon">
                  <input
                    type="text"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="admin-input"
                    placeholder="Contoh: 081234567890"
                  />
                </FormField>

                <FormField label="Gender">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="admin-input"
                  >
                    <option value="">Pilih gender</option>
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </FormField>

                <FormField label="Tanggal Lahir">
                  <input
                    type="date"
                    name="birthDate"
                    value={form.birthDate}
                    onChange={handleChange}
                    className="admin-input"
                  />
                </FormField>

                <FormField label="Role">
                  <input
                    type="text"
                    value={form.role}
                    readOnly
                    className="admin-input cursor-not-allowed opacity-80"
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Upload Foto Profile">
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          {form.profileImageUrl ? (
                            <img
                              src={form.profileImageUrl}
                              alt="Preview Profile"
                              className="h-20 w-20 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                              <UserRound size={36} />
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              Foto Profile
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                              Format JPG, PNG, atau WEBP. Maksimal 2MB.
                            </p>

                            {selectedImageName && (
                              <p className="mt-2 text-xs font-black text-blue-600 dark:text-blue-400">
                                {selectedImageName}
                              </p>
                            )}
                          </div>
                        </div>

                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700">
                          <Camera size={18} />
                          Pilih Foto
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {form.profileImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              profileImageUrl: "",
                            }));
                            setSelectedImageName("");
                          }}
                          className="mt-4 rounded-2xl border border-red-200 px-4 py-2 text-xs font-black text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Alamat">
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows="5"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Alamat lengkap admin"
                    />
                  </FormField>
                </div>
              </div>

              <div className="mt-7 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-sm font-black text-slate-950 dark:text-white">
                  Catatan
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                  Email dan role tidak bisa diedit dari halaman ini. Data yang
                  bisa diubah mengikuti request profile di user-service.
                </p>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={19} />
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileInfo({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="break-all text-sm font-black text-slate-950 dark:text-white">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
    </label>
  );
}

export default AdminProfile;
