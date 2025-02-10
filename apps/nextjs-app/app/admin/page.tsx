'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { migrateAllUsersNotes, checkMigrationStatus } from "@/lib/db";
import toast from "react-hot-toast";

// List of admin UIDs - you should move this to a secure configuration
const ADMIN_UIDS = ['BBTcFBtyj1P6BmosmcYLlaJxw1A2'];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    total: number;
    migrated: number;
    needsMigration: number;
  } | null>(null);

  // Check migration status on load
  useEffect(() => {
    if (user && ADMIN_UIDS.includes(user.uid)) {
      checkMigrationStatus().then(setMigrationStatus);
    }
  }, [user]);

  // Check if current user is admin
  const isAdmin = user && ADMIN_UIDS.includes(user.uid);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, router, loading]);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't redirect immediately, wait for auth to be determined
  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4">You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleMigrateNotes = async () => {
    try {
      setIsMigrating(true);
      const result = await migrateAllUsersNotes();
      
      if (result.success) {
        toast.success(result.message);
        // Refresh migration status
        const newStatus = await checkMigrationStatus();
        setMigrationStatus(newStatus);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error in migration:', error);
      toast.error('Failed to migrate notes. Check console for details.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="text-gray-600">
                  Migrate all notes to include workspaceId field. This will set workspaceId to null for all notes that don&apos;t have it.
                </p>
                {migrationStatus && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p>Total Notes: {migrationStatus.total}</p>
                    <p className="text-green-600">Migrated: {migrationStatus.migrated}</p>
                    <p className="text-yellow-600">Needs Migration: {migrationStatus.needsMigration}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleMigrateNotes}
                disabled={isMigrating || (migrationStatus?.needsMigration === 0)}
                className="w-full sm:w-auto"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating Notes...
                  </>
                ) : migrationStatus?.needsMigration === 0 ? (
                  'All Notes Migrated'
                ) : (
                  'Migrate All Notes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
