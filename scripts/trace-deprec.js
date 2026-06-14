// Lightweight handler to surface DeprecationWarning stacks during dev
process.on('warning', (warning) => {
  try {
    if (warning && warning.name && warning.name.includes('Deprecation')) {
      // Print a clear header and the full stack if available
      // Use stderr so it appears in logs even if stdout is buffered
      console.error('\n=== Deprecation Warning Captured ===');
      if (warning.stack) {
        console.error(warning.stack);
      } else {
        console.error(warning);
      }
      console.error('=== End Deprecation Warning ===\n');
    }
  } catch (err) {
    // Don't crash the process if logging fails
    console.error('Failed to print deprecation warning stack', err);
  }
});
