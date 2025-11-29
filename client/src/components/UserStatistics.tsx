import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Eye, 
  Users, 
  FileText, 
  Star, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Bot,
  MessageSquare,
  Radio
} from "lucide-react";
import { and } from "drizzle-orm";

interface UserStatistics {
  totalChannels: number;
  totalBots: number;
  totalGroups: number;
  totalPublications: number;
  totalViews: number;
  viewsThisMonth: number;
  totalSubscribers: number;
  totalEarnings: string;
  approvedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  avgRating: number;
  joinedDate: string;
}

export default function UserStatistics() {
  const { data: statistics, isLoading, error } = useQuery<UserStatistics>({
    queryKey: ["/api/user/statistics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <p className="text-red-600 dark:text-red-400">Не удалось загрузить статистику</p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number | undefined | null) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'М';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'К';
    }
    return num.toString();
  };

  const stats = [
    {
      title: "Всего публикаций",
      value: statistics?.totalPublications || 0,
      icon: FileText,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Всего просмотров",
      value: formatNumber(statistics?.totalViews),
      icon: Eye,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      title: "Просмотров за месяц",
      value: formatNumber(statistics?.viewsThisMonth),
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    },

    {
      title: "Средний рейтинг",
      value: (statistics?.avgRating || 0).toFixed(1),
      icon: Star,
      color: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800"
    }
  ];

  const publicationStats = [
    {
      title: "Каналы",
      value: statistics.totalChannels || 0,
      icon: Radio,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Боты",
      value: statistics.totalBots || 0,
      icon: Bot,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Группы",
      value: statistics.totalGroups || 0,
      icon: MessageSquare,
      color: "text-green-600 dark:text-green-400"
    }
  ];

  const applicationStats = [
    {
      title: "Одобрено",
      value: statistics.approvedApplications,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      title: "На рассмотрении",
      value: statistics.pendingApplications,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800"
    },
    {
      title: "Отклонено",
      value: statistics.rejectedApplications,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all duration-200 hover:scale-105`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                    <IconComponent className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Publication Breakdown */}
      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Детализация публикаций
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {publicationStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{stat.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {stat.value}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}