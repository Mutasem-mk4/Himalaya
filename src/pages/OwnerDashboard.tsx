import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Mountain, Home, Calendar, Plus, Edit, MapPin, Users, Bed, Bath } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface Chalet {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  status: 'active' | 'inactive' | 'pending';
  featured: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string;
}

export default function OwnerDashboard() {
  const { user, userRole, loading } = useAuth();
  const [chalets, setChalets] = useState<Chalet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddChalet, setShowAddChalet] = useState(false);
  const [editingChalet, setEditingChalet] = useState<Chalet | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    address: '',
    price_per_night: '',
    max_guests: '2',
    bedrooms: '1',
    bathrooms: '1',
    amenities: [] as string[],
    images: [] as string[]
  });

  const availableAmenities = [
    'WiFi', 'Kitchen', 'Fireplace', 'Hot Tub', 'Mountain View', 'Parking',
    'Balcony', 'Garden', 'Ski Storage', 'Hiking Trails Access', 'Pet Friendly',
    'Washing Machine', 'Dishwasher', 'TV', 'Sound System', 'BBQ'
  ];

  useEffect(() => {
    if (user && (userRole === 'chalet_owner' || userRole === 'admin')) {
      fetchOwnerData();
    }
  }, [user, userRole]);

  const fetchOwnerData = async () => {
    try {
      // Fetch owner's chalets
      const { data: chaletsData, error: chaletsError } = await supabase
        .from('chalets')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (chaletsError) throw chaletsError;

      // Fetch bookings for owner's chalets
      const chaletIds = chaletsData?.map(c => c.id) || [];
      let bookingsData = [];
      
      if (chaletIds.length > 0) {
        const { data, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('chalet_id', chaletIds)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;
        bookingsData = data || [];
      }

      setChalets(chaletsData || []);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching owner data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const chaletData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        price_per_night: parseFloat(formData.price_per_night),
        max_guests: parseInt(formData.max_guests),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        amenities: formData.amenities,
        images: formData.images,
        owner_id: user?.id,
        status: 'pending' as const
      };

      if (editingChalet) {
        const { error } = await supabase
          .from('chalets')
          .update(chaletData)
          .eq('id', editingChalet.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Chalet updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('chalets')
          .insert([chaletData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Chalet added successfully and is pending approval",
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        address: '',
        price_per_night: '',
        max_guests: '2',
        bedrooms: '1',
        bathrooms: '1',
        amenities: [],
        images: []
      });

      setShowAddChalet(false);
      setEditingChalet(null);
      fetchOwnerData();
    } catch (error) {
      console.error('Error saving chalet:', error);
      toast({
        title: "Error",
        description: "Failed to save chalet",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (chalet: Chalet) => {
    setFormData({
      title: chalet.title,
      description: chalet.description || '',
      location: chalet.location,
      address: chalet.address || '',
      price_per_night: chalet.price_per_night.toString(),
      max_guests: chalet.max_guests.toString(),
      bedrooms: chalet.bedrooms.toString(),
      bathrooms: chalet.bathrooms.toString(),
      amenities: chalet.amenities || [],
      images: chalet.images || []
    });
    setEditingChalet(chalet);
    setShowAddChalet(true);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (userRole !== 'chalet_owner' && userRole !== 'admin')) {
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Mountain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Owner Dashboard</h1>
                <p className="text-muted-foreground">Manage your chalet listings and bookings</p>
              </div>
            </div>

            <Dialog open={showAddChalet} onOpenChange={setShowAddChalet}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingChalet(null);
                  setFormData({
                    title: '',
                    description: '',
                    location: '',
                    address: '',
                    price_per_night: '',
                    max_guests: '2',
                    bedrooms: '1',
                    bathrooms: '1',
                    amenities: [],
                    images: []
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chalet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingChalet ? 'Edit Chalet' : 'Add New Chalet'}</DialogTitle>
                  <DialogDescription>
                    {editingChalet ? 'Update your chalet details' : 'Add a new chalet to your listings'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price per night (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        value={formData.price_per_night}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guests">Max guests *</Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        value={formData.max_guests}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms *</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="1"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms *</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min="1"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {availableAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddChalet(false);
                        setEditingChalet(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingChalet ? 'Update Chalet' : 'Add Chalet'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Chalets</CardTitle>
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
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <Mountain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{bookings.reduce((sum, booking) => sum + Number(booking.total_price), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total earnings</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="chalets" className="space-y-6">
            <TabsList>
              <TabsTrigger value="chalets">My Chalets</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="chalets">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chalets.map((chalet) => (
                  <Card key={chalet.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        <Mountain className="h-16 w-16 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{chalet.title}</h3>
                          <Badge className={getStatusColor(chalet.status)}>
                            {chalet.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {chalet.location}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {chalet.max_guests}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bed className="h-4 w-4" />
                              {chalet.bedrooms}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="h-4 w-4" />
                              {chalet.bathrooms}
                            </div>
                          </div>
                          <div className="font-semibold text-foreground">
                            €{chalet.price_per_night}/night
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(chalet)}
                            className="w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {chalets.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mountain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No chalets yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first chalet to begin accepting bookings.
                    </p>
                    <Button onClick={() => setShowAddChalet(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Chalet
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Manage bookings for your chalets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{booking.guest_name}</h3>
                          <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                          <p className="text-sm">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                          </p>
                          <p className="text-sm">Guests: {booking.guests}</p>
                          {booking.special_requests && (
                            <p className="text-sm text-muted-foreground">
                              Special requests: {booking.special_requests}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">€{booking.total_price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {bookings.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                      <p className="text-muted-foreground">
                        Once guests start booking your chalets, you'll see them here.
                      </p>
                    </div>
                  )}
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