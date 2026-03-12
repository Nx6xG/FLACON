import { useState, useMemo } from 'react';
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
import { LoginPage } from '@/pages/LoginPage';
import { FragranceDetail } from '@/components/Collection/FragranceDetail';
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
  } = useCollection(user?.id);

  const [rankingSelected, setRankingSelected] = useState<Fragrance | null>(null);

  const apiKey = profile?.fragella_api_key || import.meta.env.VITE_FRAGELLA_API_KEY || null;

  const existingFragellaIds = useMemo(
    () => new Set(fragrances.filter((f) => f.fragella_id).map((f) => f.fragella_id!)),
    [fragrances]
  );

  const handleMoveToCollection = async (id: string) => {
    return updateFragrance(id, { is_wishlist: false });
  };

  const handleImport = async (data: Fragrance[]) => {
    for (const item of data) {
      const { id, user_id, created_at, updated_at, ...input } = item;
      await addFragrance(input as FragranceInput);
    }
  };

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
          {dataLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin text-gold" />
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <CollectionPage
                    collection={collection}
                    onAdd={addFragrance}
                    onUpdate={updateFragrance}
                    onDelete={deleteFragrance}
                    apiKey={apiKey}
                  />
                }
              />
              <Route
                path="/search"
                element={
                  <SearchPage
                    onAdd={addFragrance}
                    apiKey={apiKey}
                    existingIds={existingFragellaIds}
                  />
                }
              />
              <Route
                path="/ranking"
                element={
                  <RankingPage
                    collection={collection}
                    onSelect={setRankingSelected}
                  />
                }
              />
              <Route
                path="/wishlist"
                element={
                  <WishlistPage
                    wishlist={wishlist}
                    onAdd={addFragrance}
                    onMoveToCollection={handleMoveToCollection}
                    onDelete={deleteFragrance}
                    apiKey={apiKey}
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
                    fragrances={fragrances}
                    onUpdateProfile={updateProfile}
                    onImport={handleImport}
                  />
                }
              />
            </Routes>
          )}
        </main>

        {/* Detail modal for ranking page */}
        <FragranceDetail
          fragrance={rankingSelected}
          open={!!rankingSelected}
          onClose={() => setRankingSelected(null)}
          onSave={updateFragrance}
          onDelete={deleteFragrance}
        />
      </div>
    </BrowserRouter>
  );
}
