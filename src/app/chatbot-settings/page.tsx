'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklesIcon, DatabaseIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

export default function ChatbotSettingsClient() {
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmbedAllNotes = async () => {
    setIsEmbedding(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/chat/embed-notes', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to embed notes');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsEmbedding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <SparklesIcon className="h-10 w-10 text-purple-500" />
            Chatbot Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure and manage your AI study assistant
          </p>
        </div>

        {/* Embed All Notes Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Embed All Notes
            </CardTitle>
            <CardDescription>
              Generate embeddings for all your notes to make them searchable by the AI chatbot.
              This process analyzes your notes and creates vector representations for semantic search.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleEmbedAllNotes}
              disabled={isEmbedding}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isEmbedding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Embed All Notes
                </>
              )}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {result.message}
                    </p>
                    <div className="mt-2 text-sm text-green-800 dark:text-green-200">
                      <p>✅ Successfully embedded: {result.successCount} notes</p>
                      {result.errorCount > 0 && (
                        <p>❌ Failed: {result.errorCount} notes</p>
                      )}
                      <p>📊 Total notes: {result.totalNotes}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ About Embeddings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">What are embeddings?</h3>
              <p className="text-muted-foreground">
                Embeddings are numerical representations of your notes that capture their semantic meaning.
                This allows the AI to understand and find relevant content even when exact keywords don't match.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">When to use this?</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>After creating new notes (they need to be embedded to be searchable)</li>
                <li>When you've updated existing notes with new content</li>
                <li>If the chatbot isn't finding relevant information from your notes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Performance</h3>
              <p className="text-muted-foreground">
                Processing time depends on the number and length of your notes. 
                Expect ~1-2 seconds per note. Large collections may take a few minutes.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Notes are automatically embedded when uploaded through the chatbot.
                You only need to manually embed notes created through the regular note editor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
