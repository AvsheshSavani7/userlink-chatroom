import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { createUser } from "../store/userSlice";
import UserNameForm from "../components/UserNameForm";
import WelcomeAnimation from "../components/WelcomeAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User as UserIcon, UserPlus, Trash2, AlertCircle } from "lucide-react";
import { getAllUsers, deleteUser } from "../services/assistantService";
import { User as UserType } from "../services/assistantService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Index = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);

  useEffect(() => {
    // If already authenticated, redirect to chat
    // if (isAuthenticated) {
    //   navigate("/chat");
    // }

    // Load all users
    const loadUsers = async () => {
      setLoading(true);
      try {
        const usersList = await getAllUsers();
        setUsers(usersList);

        // Automatically show create form if no users exist
        if (usersList.length === 0) {
          setShowCreateForm(true);
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
        // Show create form on error too
        setShowCreateForm(true);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAuthenticated, navigate]);

  const handleSelectUser = (user: UserType) => {
    // Update Redux store with selected user
    dispatch(
      createUser({
        id: user.id,
        name: user.name
      })
    );
    // Navigate to user's chat
    navigate(`/chat/${user.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, user: UserType) => {
    e.stopPropagation(); // Prevent card click (user selection)
    setUserToDelete(user);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${userToDelete.name}'s account...`);

    try {
      const success = await deleteUser(userToDelete.id);

      if (success) {
        // Remove user from local state
        setUsers((currentUsers) =>
          currentUsers.filter((user) => user.id !== userToDelete.id)
        );

        toast.success(`${userToDelete.name}'s account deleted successfully`, {
          id: toastId
        });

        // If we just deleted the last user, show the create form
        if (users.length <= 1) {
          setShowCreateForm(true);
        }
      } else {
        toast.error(`Failed to delete ${userToDelete.name}'s account`, {
          id: toastId
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Error deleting account: ${(error as Error).message}`, {
        id: toastId
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setUserToDelete(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-blue-50">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <div className="mb-2 animate-fade-in">
          <WelcomeAnimation />
        </div>

        <div
          className="w-full max-w-4xl text-center mb-10 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <h1 className="text-4xl font-bold mb-3 text-gray-900">
            Welcome to ChatBot
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {users.length > 0
              ? "Select an existing tenant or create a new one to start chatting."
              : "Create a new tenant to start chatting."}
          </p>
        </div>

        <div
          className="w-full max-w-3xl animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : showCreateForm || users.length === 0 ? (
            <div className="w-full max-w-md mx-auto">
              <UserNameForm />
              {users.length > 0 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Back to User List
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Select Tenant</h2>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Create New Tenant
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                  <Card
                    key={user.id}
                    className="hover:shadow-md transition-all cursor-pointer group relative"
                    onClick={() => handleSelectUser(user)}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserIcon size={24} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(e, user)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer
        className="mt-auto pt-8 w-full text-center text-sm text-gray-500 animate-fade-in"
        style={{ animationDelay: "0.6s" }}
      >
        <p>Designed by teqnodux team.</p>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => !isDeleting && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete ? (
                <>
                  <p className="mb-2">
                    Are you sure you want to delete{" "}
                    <strong>{userToDelete.name}'s</strong> account?
                  </p>
                  <p className="text-red-500 font-medium">
                    This will permanently delete:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>The user profile</li>
                    <li>All uploaded files</li>
                    <li>The AI assistant</li>
                    <li>All chat history</li>
                  </ul>
                  <p className="mt-2">This action cannot be undone.</p>
                </>
              ) : (
                "Are you sure you want to delete this user account? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
