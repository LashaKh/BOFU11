import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, ChevronDown, ChevronRight, Crown, Edit, Trash2, Check, X } from 'lucide-react';
import { ContentBriefsSectionProps, UserProfile } from './types';
import { ContentBrief } from '../../../types/contentBrief';
import { ContentBriefEditorSimple } from '../../content-brief/ContentBriefEditorSimple';
import { ResponsiveApprovalButton } from '../../common/ResponsiveApprovalButton';
import { updateBrief } from '../../../lib/contentBriefs';
import { SourceProductBrowser } from '../../content-brief/SourceProductBrowser';
import { toast } from 'react-hot-toast';

export function ContentBriefsSection({
  contentBriefs,
  companyGroup,
  isLoading,
  collapsedContentBriefs,
  onCollapseToggle,
  onDeleteBrief,
  onRefreshData,
  autoSaving,
  onAutoSaveStateChange
}: ContentBriefsSectionProps) {
  // State for inline title editing
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>('');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  // Handle title editing
  const handleTitleEdit = (brief: ContentBrief) => {
    const currentTitle = (() => {
      if (brief.title && brief.title.trim()) {
        return brief.title
          .replace(/\s*-\s*Brief\s+[a-z0-9]{8,}$/i, '')
          .replace(/\s*-\s*Content Brief\s+[a-z0-9]{8,}$/i, '')
          .replace(/\s*-\s*Content Brief$/i, '')
          .trim();
      }
      return brief.product_name || 'Untitled';
    })();
    
    setEditingTitleId(brief.id);
    setTempTitle(currentTitle);
  };

  const handleTitleSave = async (briefId: string) => {
    if (!tempTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    setIsUpdatingTitle(true);
    try {
      await updateBrief(briefId, { title: tempTitle.trim() });
      toast.success('Title updated successfully');
      setEditingTitleId(null);
      onRefreshData(); // Refresh the data to show updated title
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitleId(null);
    setTempTitle('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/30 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-green-400" />
        <h3 className="text-xl font-semibold text-white">All Company Content Briefs</h3>
        <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
          {contentBriefs.length} briefs
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading company content briefs...</span>
          </div>
        </div>
      ) : contentBriefs.length > 0 ? (
        <div className="space-y-6">
          {contentBriefs.map((brief: ContentBrief) => {
            // Find which user created this brief
            const briefCreator = companyGroup.main_account.id === brief.user_id 
              ? companyGroup.main_account 
              : companyGroup.sub_accounts.find((sub: UserProfile) => sub.id === brief.user_id);
            
            const isCollapsed = collapsedContentBriefs.has(brief.id);
            
            return (
              <div key={brief.id} className="bg-gray-700/40 rounded-lg border border-gray-600/30 group">
                <div className="p-4 border-b border-gray-600/30 bg-gray-700/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onCollapseToggle(brief.id)}
                        className="p-1 rounded-lg hover:bg-gray-600/50 transition-colors"
                        title={isCollapsed ? 'Expand content brief' : 'Collapse content brief'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <div 
                        className="cursor-pointer flex-1"
                        onClick={() => onCollapseToggle(brief.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {editingTitleId === brief.id ? (
                            // Edit mode
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="text-xl font-bold text-white bg-gray-700 border border-gray-600 rounded px-3 py-1 flex-1 focus:outline-none focus:border-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleTitleSave(brief.id);
                                  if (e.key === 'Escape') handleTitleCancel();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleTitleSave(brief.id)}
                                disabled={isUpdatingTitle}
                                className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                              >
                                {isUpdatingTitle ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={handleTitleCancel}
                                disabled={isUpdatingTitle}
                                className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            // Display mode
                            <div className="flex items-center gap-2 flex-1">
                              <h4 className="text-xl font-bold text-white leading-tight flex-1">
                                {(() => {
                                  // Clean title logic - remove any ID suffixes
                                  if (brief.title && brief.title.trim()) {
                                    // Remove any "- Brief [ID]" or "- Content Brief [ID]" suffixes
                                    const cleanTitle = brief.title
                                      .replace(/\s*-\s*Brief\s+[a-z0-9]{8,}$/i, '')
                                      .replace(/\s*-\s*Content Brief\s+[a-z0-9]{8,}$/i, '')
                                      .replace(/\s*-\s*Content Brief$/i, '')
                                      .trim();
                                    if (cleanTitle) {
                                      return cleanTitle;
                                    }
                                  }
                                  // Extract first keyword from brief content if available
                                  if (brief.brief_content) {
                                    try {
                                      let briefContent = brief.brief_content as any;
                                      if (typeof briefContent === 'string') {
                                        briefContent = JSON.parse(briefContent);
                                      }
                                      if (briefContent.keywords && Array.isArray(briefContent.keywords) && briefContent.keywords.length > 0) {
                                        const firstKeyword = briefContent.keywords[0].replace(/[`'"]/g, '').trim();
                                        const cleanKeyword = firstKeyword.replace(/^\/|\/$|^https?:\/\//, '').replace(/[-_]/g, ' ');
                                        return cleanKeyword;
                                      }
                                    } catch (error) {
                                      console.warn('Could not extract keywords from brief content:', error);
                                    }
                                  }
                                  // Fallback to product name only (no ID)
                                  return brief.product_name || `Content Brief - ${new Date(brief.created_at).toLocaleDateString()}`;
                                })()}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTitleEdit(brief);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit title"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-300">Active Brief</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-600/30 rounded-lg">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-gray-300 font-medium">Created</span>
                            <span className="text-white font-semibold">
                              {new Date(brief.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-600/30 rounded-lg">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {briefCreator?.profile_name ? briefCreator.profile_name.charAt(0).toUpperCase() : briefCreator?.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-gray-300 font-medium">Author</span>
                            <span className="text-white font-semibold">
                              {briefCreator ? (briefCreator.profile_name || briefCreator.email.split('@')[0]) : 'Unknown'}
                            </span>
                            {briefCreator?.user_type === 'main' && (
                              <Crown className="w-4 h-4 text-yellow-400 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">Content Brief</span>
                      <div className="flex items-center space-x-2">
                        <ResponsiveApprovalButton 
                          brief={brief}
                          briefId={brief.id}
                          onSuccess={onRefreshData}
                        />
                        <button
                          onClick={() => onDeleteBrief(brief.id, brief.title || brief.product_name)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/20 hover:border-red-500/30 transition-colors"
                          title="Delete content brief"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Content section - only show if not collapsed */}
                {!isCollapsed && (
                  <div className="p-6">
                    {(() => {
                    // Check if brief_content exists and has valid content
                    let hasValidContent = false;
                    let contentToPass = '';
                    
                    if (brief.brief_content) {
                      try {
                        // If brief_content is already a string (JSON), use it directly
                        if (typeof brief.brief_content === 'string') {
                          const parsed = JSON.parse(brief.brief_content);
                          hasValidContent = parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
                          contentToPass = brief.brief_content;
                        } 
                        // If brief_content is already an object, stringify it
                        else if (typeof brief.brief_content === 'object') {
                          hasValidContent = Object.keys(brief.brief_content).length > 0;
                          contentToPass = JSON.stringify(brief.brief_content);
                        }
                      } catch (error) {
                        console.error('Error parsing brief_content:', error);
                        hasValidContent = false;
                      }
                    }
                    
                    if (hasValidContent) {
                      return (
                        <div className="space-y-6">
                          {/* Source Product Browser - Show original product data */}
                          <SourceProductBrowser
                            sourceProductId={brief.source_product_id}
                            sourceProductData={brief.sourceProductData}
                            briefTitle={brief.title || brief.product_name}
                            onNavigateToProduct={(sourceProductId) => {
                              // Navigate to the approved products section and expand the product
                              const element = document.getElementById(`approved-product-${sourceProductId}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Trigger expand action - you can customize this based on your expand logic
                                setTimeout(() => {
                                  element.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                  setTimeout(() => {
                                    element.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                  }, 2000);
                                }, 100);
                              } else {
                                // Show notification if product card not found
                                console.log('Product card not found on this page:', sourceProductId);
                                toast.error('Product card is not visible on this page. It may be on another company section.');
                              }
                            }}
                          />
                          
                          {/* Editable Content Brief Display */}
                          <div className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-white font-medium flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Content Brief
                              </h5>
                              {/* Auto-save indicator */}
                              {autoSaving[brief.id] && (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50/90 text-green-700 rounded-full text-sm font-medium border border-green-200/50 backdrop-blur-sm">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span>Auto-saving...</span>
                                </div>
                              )}
                            </div>
                            <ContentBriefEditorSimple 
                              initialContent={contentToPass}
                              briefId={brief.id}
                              researchResultId={brief.research_result_id}
                              sourceProductId={brief.source_product_id}
                              onUpdate={async (content: string, links: string[], titles: string[]) => {
                                try {
                                  console.log('Admin dashboard: Auto-saving content brief changes');
                                  
                                  // Set auto-saving state
                                  onAutoSaveStateChange(brief.id, true);
                                  
                                  // Use the same updateBrief function as user dashboard for consistency
                                  await updateBrief(brief.id, {
                                    brief_content: content,
                                    internal_links: links,
                                    possible_article_titles: titles
                                  });
                                  
                                  console.log('✅ Admin dashboard: Content brief auto-saved successfully');
                                } catch (error) {
                                  console.error('Auto-save error:', error);
                                  toast.error('Failed to auto-save changes');
                                } finally {
                                  // Clear auto-saving state
                                  onAutoSaveStateChange(brief.id, false);
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center py-8 text-gray-500 bg-gray-600/20 rounded-lg border border-gray-600/30">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <h5 className="font-medium text-gray-300 mb-2">Empty Content Brief</h5>
                          <p className="text-sm text-gray-400 mb-4">
                            This content brief doesn't contain any structured content yet.
                          </p>
                          <div className="text-xs text-gray-500 space-y-1 bg-gray-700/30 rounded p-3 max-w-sm mx-auto">
                            <p><span className="font-medium">Brief Content:</span> {brief.brief_content ? 'Present but empty' : 'null'}</p>
                            <p><span className="font-medium">Product Name:</span> {brief.product_name || 'Not specified'}</p>
                            <p className="text-yellow-400 mt-2">💡 Content briefs are generated when users send products to Moonlit</p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No content briefs found for this company</p>
          <p className="text-gray-500 text-sm mt-2">
            Content briefs will appear here once company users send products to Moonlit
          </p>
        </div>
      )}
    </motion.div>
  );
}