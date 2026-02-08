// Utility functions for formatting

export const formatPrice = (price) => {
  // Price is stored as thousands (e.g., 100 = £100k)
  return `£${price}k`;
};

export const formatPriceDetailed = (price) => {
  // For detailed views, show both formats
  if (price >= 1000) {
    return `£${(price / 1000).toFixed(1)}M`;
  }
  return `£${price}k`;
};

export const formatPoints = (points) => {
  return points || 0;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};