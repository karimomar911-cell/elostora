import { useEffect, useState } from 'react'

const BRAND_NAME_KEY = 'dev_brand_name'
const BRAND_LOGO_KEY = 'dev_brand_logo'
const BRAND_BACKGROUND_KEY = 'dev_brand_background'
const SIDEBAR_LOGO_KEY = 'dev_sidebar_logo'
const BRANDING_UPDATE_EVENT = 'devBrandingUpdated'

const brandingUpdateTarget = new EventTarget()

const dispatchBrandingUpdate = () => {
  brandingUpdateTarget.dispatchEvent(new Event(BRANDING_UPDATE_EVENT))
}

const loadBranding = () => {
  const storedName = localStorage.getItem(BRAND_NAME_KEY)
  const storedLogo = localStorage.getItem(BRAND_LOGO_KEY)
  const storedBackground = localStorage.getItem(BRAND_BACKGROUND_KEY)
  const storedSidebarLogo = localStorage.getItem(SIDEBAR_LOGO_KEY)

  return {
    brandName: storedName || 'FranchiseHQ',
    brandLogo: storedLogo || null,
    brandBackground: storedBackground || null,
    sidebarLogo: storedSidebarLogo || null,
  }
}

export const useDeveloperBranding = () => {
  const initialBranding = loadBranding()
  const [brandName, setBrandNameState] = useState(initialBranding.brandName)
  const [brandLogo, setBrandLogoState] = useState(initialBranding.brandLogo)
  const [brandBackground, setBrandBackgroundState] = useState(initialBranding.brandBackground)
  const [sidebarLogo, setSidebarLogoState] = useState(initialBranding.sidebarLogo)

  useEffect(() => {
    const syncBranding = () => {
      const { brandName, brandLogo, brandBackground, sidebarLogo } = loadBranding()
      setBrandNameState(brandName)
      setBrandLogoState(brandLogo)
      setBrandBackgroundState(brandBackground)
      setSidebarLogoState(sidebarLogo)
    }

    const storageHandler = (event) => {
      if ([BRAND_NAME_KEY, BRAND_LOGO_KEY, BRAND_BACKGROUND_KEY, SIDEBAR_LOGO_KEY].includes(event.key)) {
        syncBranding()
      }
    }

    brandingUpdateTarget.addEventListener(BRANDING_UPDATE_EVENT, syncBranding)
    window.addEventListener('storage', storageHandler)

    return () => {
      brandingUpdateTarget.removeEventListener(BRANDING_UPDATE_EVENT, syncBranding)
      window.removeEventListener('storage', storageHandler)
    }
  }, [])

  const setBrandName = (name) => {
    setBrandNameState(name)
    if (name) {
      localStorage.setItem(BRAND_NAME_KEY, name)
    } else {
      localStorage.removeItem(BRAND_NAME_KEY)
    }
    dispatchBrandingUpdate()
  }

  const setBrandLogo = (logo) => {
    setBrandLogoState(logo)
    if (logo) {
      localStorage.setItem(BRAND_LOGO_KEY, logo)
    } else {
      localStorage.removeItem(BRAND_LOGO_KEY)
    }
    dispatchBrandingUpdate()
  }

  const setBrandBackground = (background) => {
    setBrandBackgroundState(background)
    if (background) {
      localStorage.setItem(BRAND_BACKGROUND_KEY, background)
    } else {
      localStorage.removeItem(BRAND_BACKGROUND_KEY)
    }
    dispatchBrandingUpdate()
  }

  const setSidebarLogo = (logo) => {
    setSidebarLogoState(logo)
    if (logo) {
      localStorage.setItem(SIDEBAR_LOGO_KEY, logo)
    } else {
      localStorage.removeItem(SIDEBAR_LOGO_KEY)
    }
    dispatchBrandingUpdate()
  }

  const resetBranding = () => {
    setBrandNameState('FranchiseHQ')
    setBrandLogoState(null)
    setBrandBackgroundState(null)
    setSidebarLogoState(null)
    localStorage.removeItem(BRAND_NAME_KEY)
    localStorage.removeItem(BRAND_LOGO_KEY)
    localStorage.removeItem(BRAND_BACKGROUND_KEY)
    localStorage.removeItem(SIDEBAR_LOGO_KEY)
    dispatchBrandingUpdate()
  }

  return {
    brandName,
    brandLogo,
    brandBackground,
    sidebarLogo,
    setBrandName,
    setBrandLogo,
    setBrandBackground,
    setSidebarLogo,
    resetBranding,
  }
}
