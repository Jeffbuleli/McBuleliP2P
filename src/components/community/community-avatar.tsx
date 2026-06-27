import { UserAvatarMark } from "@/components/profile/user-avatar-mark";

export function CommunityAvatar({
  label,
  avatarUrl,
  sizeClass = "h-11 w-11",
  textClass = "text-sm",
  className = "",
}: {
  label: string;
  avatarUrl: string | null | undefined;
  sizeClass?: string;
  textClass?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <UserAvatarMark
        email={label}
        avatarUrl={avatarUrl}
        sizeClass={sizeClass}
        textClass={textClass}
        variant="profile"
      />
    </span>
  );
}
