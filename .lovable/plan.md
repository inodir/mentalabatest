

## Muammo

Tuman admin parolni o'zgartirganda, `supabase.auth.updateUser()` muvaffaqiyatli bajariladi (200 status), lekin `onAuthStateChange` tinglovchisi darhol ishga tushadi va profildan `password_changed = false` ni qayta o'qiydi (chunki profil hali yangilanmagan). Bu `passwordChanged` holatini `false` ga qaytaradi va foydalanuvchi sahifada qolib ketadi.

## Yechim

`useAuth` hook-ida parol o'zgartirish jarayonida ham `onAuthStateChange` tinglovchisini bloklash kerak — xuddi `isSigningIn` ref kabi `isChangingPassword` ref qo'shiladi.

### O'zgartirishlar

**1. `src/hooks/useAuth.tsx`**
- Yangi `isChangingPassword` ref qo'shish
- `onAuthStateChange` ichida `isChangingPassword.current` tekshiruvini qo'shish (agar `true` bo'lsa, tinglovchi ishlamaydi)
- `markPasswordChanged` funksiyasini `isChangingPassword` ni boshqaruvchi qilish yoki yangi `setChangingPassword` funksiya qo'shish

**2. `src/pages/auth/ChangePassword.tsx`**
- Parol o'zgartirishdan oldin `isChangingPassword` flagini `true` ga o'rnatish
- Profil yangilanib, `markPasswordChanged()` chaqirilgandan keyin flagini `false` ga qaytarish
- Shuningdek, birinchi navbatda profilni yangilash, keyin parolni o'zgartirish tartibiga o'tkazish mumkin (muqobil yechim)

### Texnik tafsilotlar

`useAuth.tsx` da quyidagi o'zgartirish:

```typescript
const isChangingPassword = useRef(false);

// onAuthStateChange ichida:
if (isSigningIn.current || isChangingPassword.current) return;

// Yangi funksiya:
const setChangingPassword = (value: boolean) => {
  isChangingPassword.current = value;
};
```

`ChangePassword.tsx` da:

```typescript
const { user, role, markPasswordChanged, setChangingPassword } = useAuth();

const handleSubmit = async (e) => {
  // ...
  setChangingPassword(true);
  try {
    // 1. Avval profilni yangilash
    await supabase.from("profiles").update({ password_changed: true }).eq("user_id", user.id);
    // 2. Keyin parolni o'zgartirish
    await supabase.auth.updateUser({ password: newPassword });
    // 3. Lokal holatni yangilash
    markPasswordChanged();
    navigate(...);
  } finally {
    setChangingPassword(false);
  }
};
```

Bu yechim `onAuthStateChange` tinglovchisi parol o'zgartirish jarayonida profilni qayta o'qib, holatni buzishining oldini oladi.

