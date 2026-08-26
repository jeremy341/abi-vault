export function getClerkAppearance(dark: boolean) {
  const surface = dark ? "#1d1d1f" : "#ffffff";
  const ink = dark ? "#ffffff" : "#1d1d1f";
  const muted = dark ? "#ffffff99" : "#00000088";
  const border = dark ? "!border-white/15" : "!border-black/10";
  const hover = dark ? "hover:!bg-white/10" : "hover:!bg-black/5";
  const surfaceClass = dark ? "!bg-[#1d1d1f]" : "!bg-white";
  const inkClass = dark ? "!text-white" : "!text-ink";
  const mutedClass = dark ? "!text-white/60" : "!text-black/55";

  return {
    variables: {
      colorBackground: surface,
      colorPrimary: ink,
      colorForeground: ink,
      colorMutedForeground: muted,
      colorInput: surface,
      colorInputForeground: ink,
      borderRadius: "12px",
      fontFamily: "var(--font-geist-sans)",
    },
    elements: {
      rootBox: "w-full",
      cardBox: "w-full shadow-none",
      card: `w-full rounded-2xl ${border} ${surfaceClass} p-2 shadow-[0_16px_50px_rgb(0_0_0/0.08)]`,
      header: "hidden",
      formButtonPrimary: `rounded-xl ${dark ? "!bg-white !text-[#1d1d1f]" : "!bg-ink !text-white"} shadow-sm hover:opacity-85 focus-visible:!ring-2 focus-visible:!ring-offset-2`,
      formFieldInput: `rounded-xl ${border} ${surfaceClass} ${inkClass} shadow-none`,
      socialButtonsBlockButton: `rounded-xl ${border} ${surfaceClass} ${inkClass} shadow-none ${hover}`,
      footer: `rounded-b-2xl ${border} ${surfaceClass}`,
      footerActionLink: `${inkClass} underline underline-offset-4`,
      avatarBox: "size-8 md:size-10",
      userButtonPopoverCard: `w-72 rounded-2xl ${border} ${surfaceClass} ${inkClass} shadow-[0_16px_50px_rgb(0_0_0/0.16)]`,
      userButtonPopoverMain: inkClass,
      userPreviewMainIdentifier: inkClass,
      userPreviewSecondaryIdentifier: mutedClass,
      userButtonPopoverActionButton: `rounded-lg ${inkClass} ${hover}`,
      userButtonPopoverActionButtonText: inkClass,
      userButtonPopoverFooter: `${border} ${surfaceClass} ${mutedClass}`,
      userButtonPopoverFooterAction: mutedClass,
      userButtonPopoverFooterActionText: mutedClass,
      modalContent: `rounded-2xl ${border} ${surfaceClass} ${inkClass}`,
      userProfileRootBox: `w-[min(52rem,calc(100vw-2rem))] max-h-[min(40rem,calc(100vh-2rem))] overflow-auto rounded-2xl ${border} ${surfaceClass} ${inkClass}`,
      userProfilePage: `rounded-2xl ${border} ${surfaceClass} ${inkClass}`,
      userProfileNavbar: `${border} ${surfaceClass}`,
      userProfileSection: `${border} ${inkClass}`,
      userProfileSection__profile: `${border} ${inkClass}`,
      userProfileSection__emailAddresses: `${border} ${inkClass}`,
      userProfileSection__phoneNumbers: `${border} ${inkClass}`,
      userProfileSection__connectedAccounts: `${border} ${inkClass}`,
    },
  };
}
