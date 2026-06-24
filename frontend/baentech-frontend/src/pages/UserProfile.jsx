import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Edit,
  ImagePlus,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Save,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  createAddressApi,
  deleteAddressApi,
  getMyAddressesApi,
  getMyProfileApi,
  setMainAddressApi,
  updateAddressApi,
  updateProfileApi,
} from "../api/userProfileApi";

const emptyProfileForm = {
  fullName: "",
  phoneNumber: "",
  profileImageUrl: "",
};

const emptyAddressForm = {
  recipientName: "",
  phoneNumber: "",
  fullAddress: "",
  city: "",
  province: "",
  postalCode: "",
  mainAddress: false,
};

function UserProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);

  const [profileFileName, setProfileFileName] = useState("");

  const [addresses, setAddresses] = useState([]);

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteAddress, setSelectedDeleteAddress] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mainAddress = useMemo(() => {
    return addresses.find((item) => item.mainAddress) || null;
  }, [addresses]);

  useEffect(() => {
    fetchProfilePageData();
  }, []);

  const fetchProfilePageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileData, addressData] = await Promise.allSettled([
        getMyProfileApi(),
        getMyAddressesApi(),
      ]);

      if (profileData.status === "fulfilled") {
        const data = profileData.value || {};
        setProfile(data);
        setProfileForm({
          fullName: data.fullName || user?.name || user?.fullName || "",
          phoneNumber: data.phoneNumber || "",
          profileImageUrl: data.profileImageUrl || "",
        });

        localStorage.setItem("userProfile", JSON.stringify(data));
      } else {
        setProfile(null);
        setProfileForm({
          fullName: user?.name || user?.fullName || "",
          phoneNumber: "",
          profileImageUrl: "",
        });
      }

      if (addressData.status === "fulfilled") {
        setAddresses(Array.isArray(addressData.value) ? addressData.value : []);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.log("ERROR FETCH USER PROFILE:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil data profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WEBP.");
      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Ukuran foto maksimal 2MB.");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const base64 = await fileToBase64(file);

      setProfileFileName(file.name);
      setProfileForm((prev) => ({
        ...prev,
        profileImageUrl: base64,
      }));
    } catch (err) {
      console.log("ERROR UPLOAD PROFILE PHOTO:", err);
      setError("Gagal membaca file foto.");
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfileFileName("");
    setProfileForm((prev) => ({
      ...prev,
      profileImageUrl: "",
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!profileForm.fullName.trim()) {
      setError("Nama lengkap tidak boleh kosong.");
      return;
    }

    try {
      setSavingProfile(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        profileImageUrl: profileForm.profileImageUrl.trim(),
      };

      const response = await updateProfileApi(payload);

      setProfile(response);
      setProfileForm({
        fullName: response.fullName || "",
        phoneNumber: response.phoneNumber || "",
        profileImageUrl: response.profileImageUrl || "",
      });

      localStorage.setItem("userProfile", JSON.stringify(response));

      setSuccessMessage("Profile berhasil diperbarui.");
    } catch (err) {
      console.log("ERROR SAVE PROFILE:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menyimpan profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreateAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const openEditAddressModal = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      recipientName: address.recipientName || "",
      phoneNumber: address.phoneNumber || "",
      fullAddress: address.fullAddress || "",
      city: address.city || "",
      province: address.province || "",
      postalCode: address.postalCode || "",
      mainAddress: Boolean(address.mainAddress),
    });
    setAddressModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const closeAddressModal = () => {
    if (savingAddress) return;

    setAddressModalOpen(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAddressForm({
      ...addressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();

    const requiredFields = [
      "recipientName",
      "phoneNumber",
      "fullAddress",
      "city",
      "province",
      "postalCode",
    ];

    const hasEmptyField = requiredFields.some(
      (field) => !String(addressForm[field] || "").trim(),
    );

    if (hasEmptyField) {
      setError("Semua field alamat wajib diisi.");
      return;
    }

    try {
      setSavingAddress(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        recipientName: addressForm.recipientName.trim(),
        phoneNumber: addressForm.phoneNumber.trim(),
        fullAddress: addressForm.fullAddress.trim(),
        city: addressForm.city.trim(),
        province: addressForm.province.trim(),
        postalCode: addressForm.postalCode.trim(),
        mainAddress: Boolean(addressForm.mainAddress),
      };

      if (editingAddressId) {
        await updateAddressApi(editingAddressId, payload);
        setSuccessMessage("Alamat berhasil diperbarui.");
      } else {
        await createAddressApi(payload);
        setSuccessMessage("Alamat berhasil ditambahkan.");
      }

      closeAddressModal();

      const newAddresses = await getMyAddressesApi();
      setAddresses(newAddresses);
    } catch (err) {
      console.log("ERROR SAVE ADDRESS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menyimpan alamat.",
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetMainAddress = async (addressId) => {
    try {
      setActionLoadingId(addressId);
      setError("");
      setSuccessMessage("");

      await setMainAddressApi(addressId);

      const newAddresses = await getMyAddressesApi();
      setAddresses(newAddresses);

      setSuccessMessage("Alamat utama berhasil diubah.");
    } catch (err) {
      console.log("ERROR SET MAIN ADDRESS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengubah alamat utama.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

const openDeleteAddressModal = (address) => {
  setSelectedDeleteAddress(address);
  setDeleteModalOpen(true);
  setError("");
  setSuccessMessage("");
};

const closeDeleteAddressModal = () => {
  if (deletingAddressId) return;

  setSelectedDeleteAddress(null);
  setDeleteModalOpen(false);
};

const handleConfirmDeleteAddress = async () => {
  const addressId = selectedDeleteAddress?.id;

  if (!addressId) {
    setError("ID alamat tidak ditemukan.");
    closeDeleteAddressModal();
    return;
  }

  try {
    setDeletingAddressId(addressId);
    setActionLoadingId(addressId);
    setError("");
    setSuccessMessage("");

    await deleteAddressApi(addressId);

    setAddresses((prev) => prev.filter((item) => item.id !== addressId));
    setSuccessMessage("Alamat berhasil dihapus.");

    setSelectedDeleteAddress(null);
    setDeleteModalOpen(false);
  } catch (err) {
    console.log("ERROR DELETE ADDRESS:", err);
    setError(
      err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal menghapus alamat.",
    );
  } finally {
    setDeletingAddressId(null);
    setActionLoadingId(null);
  }
};

  const displayName =
    profile?.fullName ||
    profileForm.fullName ||
    user?.name ||
    user?.fullName ||
    "Customer";

  const displayEmail = profile?.email || user?.email || "-";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      {addressModalOpen && (
        <AddressModal
          form={addressForm}
          editing={Boolean(editingAddressId)}
          saving={savingAddress}
          onChange={handleAddressChange}
          onClose={closeAddressModal}
          onSubmit={handleSubmitAddress}
        />
      )}

      {deleteModalOpen && selectedDeleteAddress && (
        <DeleteAddressModal
          address={selectedDeleteAddress}
          deleting={deletingAddressId === selectedDeleteAddress.id}
          onClose={closeDeleteAddressModal}
          onConfirm={handleConfirmDeleteAddress}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
              My Account
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">
              Profile Saya
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Kelola data profile dan alamat pengiriman untuk checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProfilePageData}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-100 px-5 py-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-green-100 px-5 py-4 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-sm font-black text-slate-500 dark:text-slate-400">
              <Loader2 className="animate-spin" size={20} />
              Memuat profile...
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-center text-center">
                  {profileForm.profileImageUrl ? (
                    <img
                      src={profileForm.profileImageUrl}
                      alt={displayName}
                      className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover dark:border-blue-950"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-950 dark:bg-blue-950/40 dark:text-blue-300">
                      <UserRound size={48} />
                    </div>
                  )}

                  <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
                    {displayName}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {displayEmail}
                  </p>

                  <div className="mt-5 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    Customer
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  Alamat Utama
                </h3>

                {mainAddress ? (
                  <div className="mt-4 min-w-0 space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <p className="break-words font-black text-slate-950 dark:text-white">
                      {mainAddress.recipientName}
                    </p>
                    <p className="break-words">{mainAddress.phoneNumber}</p>
                    <p className="whitespace-pre-wrap break-words leading-6">
                      {mainAddress.fullAddress}
                    </p>
                    <p className="break-words">
                      {mainAddress.city}, {mainAddress.province}{" "}
                      {mainAddress.postalCode}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                    Belum ada alamat utama. Tambahkan alamat baru lalu jadikan
                    alamat utama.
                  </p>
                )}
              </div>
            </aside>

            <section className="min-w-0 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white">
                      Informasi Profile
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Data ini akan dipakai untuk identitas akun customer.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileChange}
                      placeholder="Masukkan nama lengkap"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                      Nomor HP
                    </label>
                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-blue-950">
                      <Phone size={18} className="text-slate-400" />
                      <input
                        type="text"
                        name="phoneNumber"
                        value={profileForm.phoneNumber}
                        onChange={handleProfileChange}
                        placeholder="08xxxxxxxxxx"
                        className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                      Foto Profile
                    </label>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {profileForm.profileImageUrl ? (
                          <img
                            src={profileForm.profileImageUrl}
                            alt="Preview Profile"
                            className="h-24 w-24 rounded-3xl border border-slate-200 object-cover dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                            <Camera size={34} />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            Upload foto profile
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Format JPG, PNG, atau WEBP. Maksimal 2MB.
                          </p>

                          {profileFileName && (
                            <p className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                              File: {profileFileName}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-3">
                            <label
                              htmlFor="profilePhotoInput"
                              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
                            >
                              <ImagePlus size={18} />
                              Pilih Foto
                            </label>

                            <input
                              id="profilePhotoInput"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={handleProfilePhotoUpload}
                              className="hidden"
                            />

                            {profileForm.profileImageUrl && (
                              <button
                                type="button"
                                onClick={handleRemoveProfilePhoto}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:border-red-500 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                <X size={18} />
                                Hapus Foto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {savingProfile ? "Menyimpan..." : "Simpan Profile"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white">
                      Alamat Pengiriman
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Alamat ini bisa dipakai saat checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateAddressModal}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    Tambah Alamat
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                    <MapPin className="mx-auto text-slate-400" size={42} />
                    <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">
                      Belum ada alamat
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Tambahkan alamat pengiriman pertama kamu.
                    </p>
                  </div>
                ) : (
                  <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-2">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        loading={actionLoadingId === address.id}
                        onEdit={() => openEditAddressModal(address)}
                        onDelete={() => openDeleteAddressModal(address)}
                        onSetMain={() => handleSetMainAddress(address.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function AddressCard({ address, loading, onEdit, onDelete, onSetMain }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 sm:p-5">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="min-w-0 max-w-full break-words font-black text-slate-950 dark:text-white">
              {address.recipientName}
            </h4>

            {address.mainAddress && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Star size={13} />
                Utama
              </span>
            )}
          </div>

          <p className="mt-1 break-words text-sm font-bold text-slate-500 dark:text-slate-400">
            {address.phoneNumber}
          </p>
        </div>

        <MapPin
          className="shrink-0 text-blue-600 dark:text-blue-300"
          size={22}
        />
      </div>

      <div className="min-w-0 rounded-2xl bg-white p-4 dark:bg-slate-900/70">
        <p className="max-w-full whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          {address.fullAddress}
        </p>

        <p className="mt-3 max-w-full break-words text-sm font-black text-slate-700 dark:text-slate-200">
          {address.city}, {address.province} {address.postalCode}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {!address.mainAddress && (
          <button
            type="button"
            onClick={onSetMain}
            disabled={loading}
            className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-blue-600 transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300"
          >
            Jadikan Utama
          </button>
        )}

        <button
          type="button"
          onClick={onEdit}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Edit size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60 sm:col-span-2"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Hapus
        </button>
      </div>
    </div>
  );
}
function AddressModal({ form, editing, saving, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl min-w-0 overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {" "}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-950 dark:text-white">
              {editing ? "Edit Alamat" : "Tambah Alamat"}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Lengkapi data alamat pengiriman.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={onSubmit}
          className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2"
        >
          <FormInput
            label="Nama Penerima"
            name="recipientName"
            value={form.recipientName}
            onChange={onChange}
            placeholder="Nama penerima"
            required
          />

          <FormInput
            label="Nomor HP"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
            placeholder="08xxxxxxxxxx"
            required
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
              Alamat Lengkap
            </label>
            <textarea
              name="fullAddress"
              value={form.fullAddress}
              onChange={onChange}
              placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan..."
              rows="4"
              className="min-h-28 w-full min-w-0 resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
              required
            />
          </div>

          <FormInput
            label="Kota"
            name="city"
            value={form.city}
            onChange={onChange}
            placeholder="Bandung"
            required
          />

          <FormInput
            label="Provinsi"
            name="province"
            value={form.province}
            onChange={onChange}
            placeholder="Jawa Barat"
            required
          />

          <FormInput
            label="Kode Pos"
            name="postalCode"
            value={form.postalCode}
            onChange={onChange}
            placeholder="40564"
            required
          />

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <input
              type="checkbox"
              name="mainAddress"
              checked={form.mainAddress}
              onChange={onChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
              Jadikan alamat utama
            </span>
          </label>

          <div className="mt-4 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function DeleteAddressModal({ address, deleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <Trash2 size={26} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              Hapus Alamat?
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Alamat milik{" "}
              <span className="font-black text-slate-900 dark:text-white">
                {address.recipientName}
              </span>{" "}
              akan dihapus dari sistem. Aksi ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
          <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
            Detail Alamat
          </p>

          <div className="mt-3 min-w-0 space-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <p className="break-words font-black text-slate-950 dark:text-white">
              {address.recipientName}
            </p>

            <p className="break-words">{address.phoneNumber}</p>

            <p className="whitespace-pre-wrap break-words leading-6">
              {address.fullAddress}
            </p>

            <p className="break-words">
              {address.city}, {address.province} {address.postalCode}
            </p>

            {address.mainAddress && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Star size={13} />
                Alamat Utama
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={17} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
function FormInput({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
        required={required}
      />
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export default UserProfile;
