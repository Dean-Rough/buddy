if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const React = require('react');
  const whyDidYouRender = require('why-did-you-render');

  whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackHooks: true,
    logOwnerReasons: true,
    collapseGroups: true,
    include: [/^Chat/, /^Brutal/], // Only track components starting with Chat or Brutal
  });
}

export {};
