/* Publishing is deliberately gated behind an explicit user approval. */
const PublishingService = {
  async publishApprovedPost(post, approval) {
    if (!approval?.userApproved) throw new Error('Publishing blocked: explicit user approval is required');
    const apiKeys = await StorageService.getAPIKeys();
    if (!apiKeys.twitter) throw new Error('Publishing blocked: user-provided X credentials are required');
    // The portfolio build intentionally does not transmit content externally.
    // A production adapter can be added here after OAuth 2.0, scopes, and client policy review.
    return { status: 'ready_for_adapter', content: post.content, approvedAt: new Date().toISOString() };
  },
};
