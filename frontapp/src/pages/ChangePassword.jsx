// src/pages/ChangePassword.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const isFirstLogin = user?.mustChangePassword;

  // 🔑 CRITIQUE : Si le changement de mot de passe a réussi et mustChangePassword passe à false
  // alors naviguer immédiatement vers le dashboard
  useEffect(() => {
    if (success && !isFirstLogin && isFirstLogin !== undefined) {
      // Le flag a été mis à jour à false, donc on peut naviguer
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500); // Garder 1.5s pour voir le message de succès
      return () => clearTimeout(timer);
    }
  }, [success, isFirstLogin, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setError("Tous les champs sont requis.");
    }

    if (newPassword.length < 6) {
      return setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
    }

    if (newPassword !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }

    if (currentPassword === newPassword) {
      return setError("Le nouveau mot de passe doit être différent de l'ancien.");
    }

    setLoading(true);

    try {
      await changePassword({ currentPassword, newPassword });
      
      setSuccess("Mot de passe modifié avec succès !");
      // Le useEffect gérera la redirection une fois que le state du user est mis à jour
      
    } catch (err) {
      setError(err.message || "Échec du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white py-8 px-4">
      <div className="w-full max-w-md">
        {/* Header avec alerte si première connexion */}
        {isFirstLogin && (
          <div className="mb-6 rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-orange-900 mb-1">Première connexion</h3>
                <p className="text-sm text-orange-800">
                  Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Carte principale */}
        <div className="rounded-2xl border border-black/10 bg-white shadow-lg p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-orange-700 tracking-tight">
              {isFirstLogin ? "Changement obligatoire" : "Changer mon mot de passe"}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {isFirstLogin 
                ? "Définissez un nouveau mot de passe sécurisé" 
                : "Modifiez votre mot de passe actuel"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Mot de passe actuel */}
            <div>
              <label htmlFor="currentPassword" className="mb-1 block text-sm text-gray-600">
                Mot de passe actuel <span className="text-orange-600">*</span>
              </label>
              <div className="flex">
                <input
                  id="currentPassword"
                  type={showCurrentPwd ? "text" : "password"}
                  className="w-full rounded-l-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd((v) => !v)}
                  className="rounded-r-xl border border-l-0 border-black/10 px-3 flex items-center justify-center text-gray-600 hover:bg-orange-50"
                  aria-label={showCurrentPwd ? "Masquer" : "Afficher"}
                >
                  {showCurrentPwd ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M6.343 6.343A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.22-.403 4.575-1.125M17.657 17.657A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.22.403-4.575 1.125M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 0c0 5.25 7.5 9 7.5 9s7.5-3.75 7.5-9a7.5 7.5 0 10-15 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm text-gray-600">
                Nouveau mot de passe <span className="text-orange-600">*</span>
              </label>
              <div className="flex">
                <input
                  id="newPassword"
                  type={showNewPwd ? "text" : "password"}
                  className="w-full rounded-l-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="rounded-r-xl border border-l-0 border-black/10 px-3 flex items-center justify-center text-gray-600 hover:bg-orange-50"
                  aria-label={showNewPwd ? "Masquer" : "Afficher"}
                >
                  {showNewPwd ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M6.343 6.343A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.22-.403 4.575-1.125M17.657 17.657A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.22.403-4.575 1.125M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 0c0 5.25 7.5 9 7.5 9s7.5-3.75 7.5-9a7.5 7.5 0 10-15 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="mt-1 text-xs text-orange-600">Le mot de passe doit contenir au moins 6 caractères</p>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm text-gray-600">
                Confirmer le mot de passe <span className="text-orange-600">*</span>
              </label>
              <div className="flex">
                <input
                  id="confirmPassword"
                  type={showConfirmPwd ? "text" : "password"}
                  className="w-full rounded-l-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le nouveau mot de passe"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  className="rounded-r-xl border border-l-0 border-black/10 px-3 flex items-center justify-center text-gray-600 hover:bg-orange-50"
                  aria-label={showConfirmPwd ? "Masquer" : "Afficher"}
                >
                  {showConfirmPwd ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M6.343 6.343A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.22-.403 4.575-1.125M17.657 17.657A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.22.403-4.575 1.125M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 0c0 5.25 7.5 9 7.5 9s7.5-3.75 7.5-9a7.5 7.5 0 10-15 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Messages d'erreur et succès */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
                {isFirstLogin && (
                  <p className="mt-1 text-xs">Redirection vers le dashboard...</p>
                )}
              </div>
            )}

            {/* Boutons */}
            <div className="space-y-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-orange-600 px-4 py-2 text-white font-semibold shadow hover:bg-orange-500 disabled:opacity-60"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                {loading ? "Changement en cours…" : "Changer le mot de passe"}
              </button>

              {!isFirstLogin && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full rounded-xl bg-white px-4 py-2 text-gray-700 font-medium border border-black/10 hover:bg-gray-50"
                >
                  Annuler
                </button>
              )}

              {isFirstLogin && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl bg-white px-4 py-2 text-gray-700 font-medium border border-black/10 hover:bg-gray-50"
                >
                  Se déconnecter
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Conseils de sécurité */}
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <h4 className="font-semibold mb-2">💡 Conseils pour un mot de passe sécurisé :</h4>
          <ul className="space-y-1 text-xs ml-4 list-disc">
            <li>Utilisez au moins 8 caractères</li>
            <li>Mélangez majuscules, minuscules, chiffres et symboles</li>
            <li>Ne réutilisez pas vos anciens mots de passe</li>
            <li>Évitez les informations personnelles évidentes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}