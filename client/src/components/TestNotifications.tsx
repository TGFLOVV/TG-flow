import { useToast } from "@/hooks/use-toast"

export function TestNotifications() {
  const { toast } = useToast()

  return (
    <div className="fixed bottom-4 left-4 space-x-2 z-50">
      <button
        onClick={() => toast({ 
          title: "Успешно!", 
          description: "Тестовое уведомление работает" 
        })}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Успех
      </button>
      <button
        onClick={() => toast({ 
          title: "Ошибка!", 
          description: "Тестовое уведомление об ошибке",
          variant: "destructive"
        })}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Ошибка
      </button>
    </div>
  )
}over:bg-red-700"
      >
        Ошибка
      </button>
    </div>
  )
}