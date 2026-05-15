import { lazy } from 'react'

/**
 * Wraps React.lazy with a retry mechanism.
 * Useful for SPA deployments where a new deployment might invalidate old chunks
 * causing users with stale HTML to encounter chunk load errors.
 */
export const lazyWithRetry = (componentImport, retriesLeft = 2, interval = 1000) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      componentImport()
        .then(resolve)
        .catch((error) => {
          if (retriesLeft === 0) {
            // If we run out of retries, it might be a new deployment. Force reload.
            if (String(error).includes('Failed to fetch dynamically imported module')) {
              window.location.reload()
            }
            reject(error)
            return
          }
          console.warn(`Chunk load failed, retrying... (${retriesLeft} retries left)`)
          setTimeout(() => {
            // We can't re-call lazyWithRetry here directly because it returns a React component.
            // We just need to resolve the promise.
            // Let's implement a recursive promise approach.
            const retryImport = (retries, delay) => {
              componentImport()
                .then(resolve)
                .catch((err) => {
                  if (retries === 0) {
                    if (String(err).includes('Failed to fetch dynamically imported module')) {
                      window.location.reload()
                    }
                    reject(err)
                  } else {
                    console.warn(`Chunk load failed, retrying... (${retries} retries left)`)
                    setTimeout(() => retryImport(retries - 1, delay), delay)
                  }
                })
            }
            retryImport(retriesLeft - 1, interval)
          }, interval)
        })
    })
  })
}
