import { useState, useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useCollection';
import { CollectionPage } from '@/pages/CollectionPage';
import { SearchPage } from '@/pages/SearchPage';
import { RankingPage } from '@/pages/RankingPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SharePage } from '@/pages/SharePage';
import { LoginPage } from '@/pages/LoginPage';
import { FragranceDetail } from '@/components/Collection/FragranceDetail';
import { useToast, ToastContainer } from '@/components/common';
import { usePublicShare } from '@/hooks/usePublicShare';
import type { Fragrance, FragranceInput } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, profile, loading: authLoading, signInWithGoogle, signOut, updateProfile } = useAuth();
  const {
    fragrances,
    collection,
    wishlist,
    loading: dataLoading,
    addFragrance,
    updateFragrance,
    deleteFragrance,
    error: collectionError,
  } = useCollection(user?.id);

  const [rankingSelected, setRankingSelected] = useState<Fragrance | null>(null);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const { shareUrl } = usePublicShare(user?.id);

  // Show collection errors as toasts
  useEffect(() => {
    if (collectionError) showToast(`Fehler: ${collectionError}`);
  }, [collectionError, showToast]);

  const existingKeys = useMemo(
    () => new Set(fragrances.map((f) => `${f.name.toLowerCase()}::${f.brand.toLowerCase()}`)),
    [fragrances]
  );

  const addWithToast = useCallback(async (input: FragranceInput) => {
    const result = await addFragrance(input);
    if (result) {
      showToast(input.is_wishlist
        ? `${input.name} zur Wunschliste hinzugefügt`
        : `${input.name} zur Sammlung hinzugefügt`
      );
    }
    return result;
  }, [addFragrance, showToast]);

  const deleteWithUndo = useCallback(async (id: string) => {
    const fragrance = fragrances.find((f) => f.id === id);
    const success = await deleteFragrance(id);
    if (success && fragrance) {
      const { id: _id, user_id, created_at, updated_at, ...input } = fragrance;
      showToast(`${fragrance.name} gelöscht`, () => {
        addFragrance(input as FragranceInput);
      });
    }
    return success;
  }, [fragrances, deleteFragrance, addFragrance, showToast]);

  const handleMoveToCollection = async (id: string) => {
    return updateFragrance(id, { is_wishlist: false });
  };

  const handleImport = async (data: Fragrance[]) => {
    for (const item of data) {
      const { id, user_id, created_at, updated_at, ...input } = item;
      await addFragrance(input as FragranceInput);
    }
  };

  // Public share route — accessible without auth
  if (window.location.pathname.startsWith('/share/')) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/share/:code" element={<SharePage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  // Login
  if (!user) {
    return <LoginPage onSignIn={signInWithGoogle} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg font-body text-txt">
        <Header user={user} onSignOut={signOut} />
        <main className="max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route
                path="/"
                element={
                  <CollectionPage
                    collection={collection}
                    loading={dataLoading}
                    onAdd={addWithToast}
                    onUpdate={updateFragrance}
                    onDelete={deleteWithUndo}
                    existingIds={existingKeys}
                    shareUrl={shareUrl}
                    onToast={showToast}
                  />
                }
              />
              <Route
                path="/search"
                element={
                  <SearchPage
                    onAdd={addWithToast}
                    existingIds={existingKeys}
                  />
                }
              />
              <Route
                path="/ranking"
                element={
                  <RankingPage
                    collection={collection}
                    onSelect={setRankingSelected}
                    onUpdate={updateFragrance}
                  />
                }
              />
              <Route
                path="/wishlist"
                element={
                  <WishlistPage
                    wishlist={wishlist}
                    onAdd={addWithToast}
                    onMoveToCollection={handleMoveToCollection}
                    onDelete={deleteWithUndo}
                    existingIds={existingKeys}
                    onToast={showToast}
                  />
                }
              />
              <Route
                path="/stats"
                element={<StatsPage fragrances={fragrances} />}
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    profile={profile}
                    userId={user.id}
                    fragrances={fragrances}
                    onUpdateProfile={updateProfile}
                    onImport={handleImport}
                    onToast={showToast}
                  />
                }
              />
            </Routes>
        </main>

        {/* Detail modal for ranking page */}
        <FragranceDetail
          fragrance={rankingSelected}
          open={!!rankingSelected}
          onClose={() => setRankingSelected(null)}
          onSave={updateFragrance}
          onDelete={deleteFragrance}
          onToast={showToast}
        />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </BrowserRouter>
  );
}
