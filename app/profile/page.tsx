import LogoutButton from "@/app/Components/LogoutButton";
import ProtectedRoute from "@/app/Components/ProtectedRoute";

export default function Profile() {
  return (
    <ProtectedRoute>
      <h1>Welcome to your profile page</h1>
      <LogoutButton />
    </ProtectedRoute>
  );
}