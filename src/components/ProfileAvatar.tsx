import type { Profile } from "@/lib/profiles"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * A profile's avatar: its emoji if it has one, else the Google photo (only
 * ever passed for the account holder's own profile), else its initial.
 */
export default function ProfileAvatar({
  profile,
  photoURL,
  className,
}: {
  profile: Pick<Profile, "name" | "emoji"> | null
  photoURL?: string | null
  className?: string
}) {
  return (
    <Avatar className={cn(className)}>
      {!profile?.emoji && photoURL && <AvatarImage src={photoURL} alt="" />}
      <AvatarFallback>
        {profile ? profile.emoji || profile.name.trim()[0] || "?" : "⨯"}
      </AvatarFallback>
    </Avatar>
  )
}
