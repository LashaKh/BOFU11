import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { approveContentBriefWithMoonlit } from '../../lib/moonlit';
import { supabase } from '../../lib/supabase';
import { createArticleGenerationNotification } from '../../lib/userNotifications';
import { ContentGenerationSuccessModal } from '../ui/ContentGenerationSuccessModal';

interface ApproveContentBriefProps {
  contentBrief: string;
  internalLinks: string;
  articleTitle: string;
  contentFramework: string;
  briefId: string;
  briefStatus?: string; // Add brief status prop
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function ApproveContentBrief({
  contentBrief,
  internalLinks,
  articleTitle,
  contentFramework,
  briefId,
  briefStatus,
  onSuccess,
  onError
}: ApproveContentBriefProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleApprove = async () => {
    // Check if user has approved the brief first
    if (briefStatus !== 'approved') {
      toast.error('This brief must be approved by the user before it can be sent for article generation');
      return;
    }
    
    // Validate required fields
    if (!contentBrief || !articleTitle) {
      toast.error('Content brief and article title are required');
      return;
    }
    
    // Show success modal after 5 seconds regardless of Moonlit completion
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 5000);
    
    // Show initial loading toast
    const loadingToast = toast.loading(
      <div className="flex items-center gap-3">
        <div className="animate-pulse">📝</div>
        <div>
          <p className="font-medium">Approving Content Brief</p>
          <p className="text-sm text-gray-400">Processing your request...</p>
        </div>
      </div>
    );
    
    setIsApproving(true);

    try {
      // Get current user
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      // Fetch brief data and research_result_id from content_briefs table
      let researchResultId: string | null = null;
      let productName: string | null = null;
      if (briefId) {
        const { data: briefData, error: briefError } = await supabase
          .from('content_briefs')
          .select('research_result_id, product_name')
          .eq('id', briefId)
          .single();

        if (briefError) {
          console.error('Error fetching brief data:', briefError);
          // Decide if you want to proceed without it or show an error
        }
        if (briefData) {
          researchResultId = briefData.research_result_id;
          productName = briefData.product_name;
        }
      }

      await approveContentBriefWithMoonlit({
        contentBrief,
        internalLinks,
        articleTitle,
        contentFramework,
        research_result_id: researchResultId
      });
      
      // Note: We don't send the article generation notification here anymore
      // The actual notification will be sent by the database trigger when Moonlit
      // completes the article generation and updates the article_content field
      console.log('Content brief sent to Moonlit. Article generation notification will be sent automatically when the article is ready.');
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium">Article Generation Started</p>
            <p className="text-sm text-gray-400">Your content brief has been sent to Moonlit for processing. You will receive automatic notifications when your article is ready.</p>
          </div>
        </div>
      );
      
      onSuccess?.();
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast.error(
        <div className="flex items-center gap-3">
          <div className="text-red-500">❌</div>
          <div>
            <p className="font-medium">Error Approving Content Brief</p>
            <p className="text-sm text-gray-400">{errorMessage}</p>
          </div>
        </div>
      );
      
      if (error instanceof Error) {
        onError?.(error);
      }
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleApprove}
        disabled={isApproving || briefStatus !== 'approved'}
        className={`
          inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium
          ${isApproving || briefStatus !== 'approved'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner'
            : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg'
          }
          transition-all duration-200 ease-in-out
        `}
        title={briefStatus !== 'approved' 
          ? "User must approve this brief first before it can be sent for article generation"
          : "Send content brief to Moonlit for content generation"
        }
      >
        {isApproving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>{briefStatus !== 'approved' ? 'Waiting for User Approval' : 'Approve & Generate'}</span>
          </>
        )}
      </button>

      <ContentGenerationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        trackingId={briefId}
        title="Article Generation Initiated!"
        description="Your content brief has been sent to Moonlit for article generation"
        processingLocation="Moonlit AI Engine"
        estimatedTime="5-8 minutes"
        additionalInfo="You'll receive automatic notifications when your article is ready"
      />
    </>
  );
}
