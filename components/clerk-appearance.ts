export function getClerkAppearance(dark: boolean) {
  const surface = dark ? "#181818" : "#ffffff";
  const ink = dark ? "#ededed" : "#141414";
  const paper = dark ? "#121212" : "#fcfcfc";
  const muted = dark ? "#a8a8a8" : "#5a5a5a";
  const border = dark ? "!border-[#2a2a2a]" : "!border-[#e2e2e2]";
  const control = dark ? "!border-[#6f6f6f]" : "!border-[#8c8c8c]";
  const hover = dark ? "hover:!bg-[#1c1c1c]" : "hover:!bg-[#f3f3f3]";
  const surfaceClass = dark ? "!bg-[#181818]" : "!bg-white";
  const inkClass = dark ? "!text-[#ededed]" : "!text-[#141414]";
  const mutedClass = dark ? "!text-[#a8a8a8]" : "!text-[#5a5a5a]";

  const primaryClass = dark
    ? "!bg-[#ededed] !text-[#121212]"
    : "!bg-[#141414] !text-[#fcfcfc]";

  return {
    variables: {
      colorBackground: surface,
      colorPrimary: ink,
      colorForeground: ink,
      colorMutedForeground: muted,
      colorInput: surface,
      colorInputForeground: ink,
      colorNeutral: ink,
      colorDanger: dark ? "#ff8a80" : "#b3261e",
      colorShimmer: paper,
      borderRadius: "3px",
      fontFamily: "var(--font-host-grotesk)",
    },
    elements: {
      rootBox: "w-full",
      cardBox: "w-full shadow-none",
      card: `w-full rounded-[6px] ${border} ${surfaceClass} p-2 shadow-none`,
      header: "hidden",
      formButtonPrimary: `rounded-[3px] ${primaryClass} shadow-none hover:opacity-90`,
      formFieldInput: `rounded-[3px] ${control} ${surfaceClass} ${inkClass} shadow-none`,
      socialButtonsBlockButton: `rounded-[3px] ${control} ${surfaceClass} ${inkClass} shadow-none ${hover}`,
      footer: `rounded-b-[6px] ${border} ${surfaceClass}`,
      footerActionLink: `${inkClass} underline underline-offset-4`,
      avatarBox: "size-8 md:size-10 rounded-[3px]",
      userButtonPopoverCard: `w-72 rounded-[6px] ${border} ${surfaceClass} ${inkClass} shadow-[0_8px_24px_rgb(0_0_0_/_12%)]`,
      userButtonPopoverMain: inkClass,
      userPreviewMainIdentifier: inkClass,
      userPreviewSecondaryIdentifier: mutedClass,
      userButtonPopoverActionButton: `rounded-[3px] ${inkClass} ${hover}`,
      userButtonPopoverActionButtonText: inkClass,
      userButtonPopoverFooter: `${border} ${surfaceClass} ${mutedClass}`,
      userButtonPopoverFooterAction: mutedClass,
      userButtonPopoverFooterActionText: mutedClass,
      modalContent: `rounded-[6px] ${border} ${surfaceClass} ${inkClass}`,
      userProfileRootBox: `w-[min(52rem,calc(100vw-2rem))] max-h-[min(40rem,calc(100vh-2rem))] overflow-auto rounded-[6px] ${border} ${surfaceClass} ${inkClass}`,
      userProfilePage: `rounded-[6px] ${border} ${surfaceClass} ${inkClass}`,
      userProfileNavbar: `${border} ${surfaceClass}`,
      userProfileSection: `${border} ${inkClass}`,
      userProfileSection__profile: `${border} ${inkClass}`,
      userProfileSection__emailAddresses: `${border} ${inkClass}`,
      userProfileSection__phoneNumbers: `${border} ${inkClass}`,
      userProfileSection__connectedAccounts: `${border} ${inkClass}`,
    },
  };
}
