"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

interface ExtendedAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  status?: "online" | "offline" | "busy"
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  ExtendedAvatarProps
>(({ className, status, ...props }, ref) => (
  <div className="relative">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-purple-500/30",
        className
      )}
      {...props}
    />
    {status && (
      <span className={cn(
        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
        status === "online" ? "bg-green-500" : 
        status === "busy" ? "bg-yellow-500" : "bg-gray-500"
      )} />
    )}
  </div>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    validateSrc?: boolean
  }
>(({ className, validateSrc = true, src, key, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false)

  // Сбрасываем ошибку при изменении src
  React.useEffect(() => {
    setHasError(false)
  }, [src])

  // Отключаем валидацию для base64 изображений
  if (!src || (validateSrc && hasError && !src.startsWith('data:'))) return null

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      key={key || src} // Используем key для принудительного обновления
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={(e) => {
        console.error('Avatar loading error:', src, e);
        if (validateSrc) setHasError(true);
      }}
      onLoad={() => {
        console.log('Avatar loaded successfully:', src);
      }}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo=";

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full overflow-hidden",
        className
      )}
      {...props}
    >
      <img 
        src={defaultAvatar}
        alt="Incognito Avatar"
        className="w-full h-full object-cover"
      />
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }