import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Mountain, Users, Home, Calendar, Settings, Eye, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChaletWithOwner {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  status: 'active' | 'inactive' | 'pending';
  owner_id: string;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
}

interface BookingWithChalet {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guest_name: string;
  guest_email: string;
  chalet_title?: string;
  chalet_location?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  user_roles: string[];
}

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const [chalets, setChalets] = useState<ChaletWithOwner[]>([]);
  const [bookings, setBookings] = useState<BookingWithChalet[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchDashboardData();
    }
  }, [user, userRole]);

  const fetchDashboardData = async () => {
    try {
      // Fetch chalets with owner info
      const { data: chaletsData, error: chaletsError } = await supabase
        .from('chalets')
        .select('*')
        .order('created_at', { ascending: false });

      if (chaletsError) throw chaletsError;

      // Get owner details for chalets
      const chaletsWithOwners: ChaletWithOwner[] = [];
      if (chaletsData) {
        for (const chalet of chaletsData) {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', chalet.owner_id)
            .single();

          chaletsWithOwners.push({
            ...chalet,
            owner_name: ownerProfile?.full_name || 'Unknown',
            owner_email: ownerProfile?.email || 'Unknown'
          });
        }
      }

      // Fetch bookings with chalet info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Get chalet details for bookings
      const bookingsWithChalets: BookingWithChalet[] = [];
      if (bookingsData) {
        for (const booking of bookingsData) {
          const { data: chalet } = await supabase
            .from('chalets')
            .select('title, location')
            .eq('id', booking.chalet_id)
            .single();

          bookingsWithChalets.push({
            ...booking,
            chalet_title: chalet?.title || 'Unknown',
            chalet_location: chalet?.location || 'Unknown'
          });
        }
      }

      // Fetch users with roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const usersWithRoles: UserProfile[] = [];
      if (profilesData) {
        for (const profile of profilesData) {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          usersWithRoles.push({
            ...profile,
            user_roles: userRoles?.map(r => r.role) || []
          });
        }
      }

      setChalets(chaletsWithOwners);
      setBookings(bookingsWithChalets);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const updateChaletStatus = async (chaletId: string, status: 'active' | 'inactive' | 'pending') => {
    try {
      const { error } = await supabase
        .from('chalets')
        .update({ status })
        .eq('id', chaletId);

      if (error) throw error;

      setChalets(prev => prev.map(chalet => 
        chalet.id === chaletId ? { ...chalet, status } : chalet
      ));

      toast({
        title: "Success",
        description: `Chalet status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating chalet status:', error);
      toast({
        title: "Error",
        description: "Failed to update chalet status",
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));

      toast({
        title: "Success",
        description: `Booking status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'inactive': case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-8">
            <Mountain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your Himalaya chalet rental platform</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Chalets</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chalets.length}</div>
                <p className="text-xs text-muted-foreground">
                  {chalets.filter(c => c.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <p className="text-xs text-muted-foreground">
                  {bookings.filter(b => b.status === 'pending').length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{bookings.reduce((sum, booking) => sum + Number(booking.total_price), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total bookings value</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="chalets" className="space-y-6">
            <TabsList>
              <TabsTrigger value="chalets">Chalets</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="chalets">
              <Card>
                <CardHeader>
                  <CardTitle>Chalet Management</CardTitle>
                  <CardDescription>Manage and approve chalet listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chalets.map((chalet) => (
                      <div key={chalet.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{chalet.title}</h3>
                          <p className="text-sm text-muted-foreground">{chalet.location}</p>
                          <p className="text-sm">€{chalet.price_per_night}/night</p>
                          <p className="text-xs text-muted-foreground">
                            Owner: {chalet.owner_name} ({chalet.owner_email})
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(chalet.status)}>
                            {chalet.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateChaletStatus(chalet.id, 'active')}
                              disabled={chalet.status === 'active'}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateChaletStatus(chalet.id, 'inactive')}
                              disabled={chalet.status === 'inactive'}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Management</CardTitle>
                  <CardDescription>View and manage all bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{booking.chalet_title}</h3>
                          <p className="text-sm text-muted-foreground">{booking.chalet_location}</p>
                          <p className="text-sm">
                            {booking.guest_name} ({booking.guest_email})
                          </p>
                          <p className="text-sm">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium">€{booking.total_price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              disabled={booking.status === 'confirmed'}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              disabled={booking.status === 'cancelled'}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View all registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.full_name || 'No name'}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.user_roles?.map((role, index) => (
                            <Badge key={index} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}