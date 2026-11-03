export function getClerkAppearance(dark: boolean) {
  const surface = dark ? "#242923" : "#ffffff";
  const ink = dark ? "#e0e7d6" : "#242824";
  const muted = dark ? "#a5aba1" : "#68745e";
  const border = dark ? "!border-[#3b4335]" : "!border-[#dfe3d9]";
  const hover = dark ? "hover:!bg-[#333a2f]" : "hover:!bg-[#eef2e7]";
  const surfaceClass = dark ? "!bg-[#242923]" : "!bg-white";
  const inkClass = dark ? "!text-[#e0e7d6]" : "!text-[#242824]";
  const mutedClass = dark ? "!text-[#a5aba1]" : "!text-[#68745e]";

  return {
    variables: {
      colorBackground: surface,
      colorPrimary: ink,
      colorForeground: ink,
      colorMutedForeground: muted,
      colorInput: surface,
      colorInputForeground: ink,
      borderRadius: "7px",
      fontFamily: "var(--font-manrope)",
    },
    elements: {
      rootBox: "w-full",
      cardBox: "w-full shadow-none",
      card: `w-full rounded-[10px] ${border} ${surfaceClass} p-2 shadow-[0_8px_24px_rgb(45_51_40_/_8%)]`,
      header: "hidden",
      formButtonPrimary: `rounded-[7px] ${dark ? "!bg-[#d4ef89] !text-[#26311f]" : "!bg-[#d4ef89] !text-[#26311f]"} shadow-sm hover:brightness-95 focus-visible:!ring-2 focus-visible:!ring-offset-2`,
      formFieldInput: `rounded-[7px] ${border} ${surfaceClass} ${inkClass} shadow-none`,
      socialButtonsBlockButton: `rounded-[7px] ${border} ${surfaceClass} ${inkClass} shadow-none ${hover}`,
      footer: `rounded-b-[10px] ${border} ${surfaceClass}`,
      footerActionLink: `${inkClass} underline underline-offset-4`,
      avatarBox: "size-8 md:size-10",
      userButtonPopoverCard: `w-72 rounded-[10px] ${border} ${surfaceClass} ${inkClass} shadow-[0_8px_24px_rgb(45_51_40_/_16%)]`,
      userButtonPopoverMain: inkClass,
      userPreviewMainIdentifier: inkClass,
      userPreviewSecondaryIdentifier: mutedClass,
      userButtonPopoverActionButton: `rounded-[6px] ${inkClass} ${hover}`,
      userButtonPopoverActionButtonText: inkClass,
      userButtonPopoverFooter: `${border} ${surfaceClass} ${mutedClass}`,
      userButtonPopoverFooterAction: mutedClass,
      userButtonPopoverFooterActionText: mutedClass,
      modalContent: `rounded-[10px] ${border} ${surfaceClass} ${inkClass}`,
      userProfileRootBox: `w-[min(52rem,calc(100vw-2rem))] max-h-[min(40rem,calc(100vh-2rem))] overflow-auto rounded-[10px] ${border} ${surfaceClass} ${inkClass}`,
      userProfilePage: `rounded-[10px] ${border} ${surfaceClass} ${inkClass}`,
      userProfileNavbar: `${border} ${surfaceClass}`,
      userProfileSection: `${border} ${inkClass}`,
      userProfileSection__profile: `${border} ${inkClass}`,
      userProfileSection__emailAddresses: `${border} ${inkClass}`,
      userProfileSection__phoneNumbers: `${border} ${inkClass}`,
      userProfileSection__connectedAccounts: `${border} ${inkClass}`,
    },
  };
}
