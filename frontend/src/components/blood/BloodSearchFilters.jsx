import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Droplets, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BloodSearchFilters({
  selectedBloodGroup,
  setSelectedBloodGroup,
  selectedCity,
  setSelectedCity,
  onSearch,
  isSearching,
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  cities = ['New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata', 'Hyderabad']
}) {
  return (
    <>
      {/* DESKTOP SEARCH FORM (md+) */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Search Blood Availability
            </CardTitle>
            <CardDescription>
              Find blood banks with available units near you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="bloodGroupDesktop">Blood Group</Label>
                <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                  <SelectTrigger id="bloodGroupDesktop" className="mt-1.5">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blood Groups</SelectItem>
                    {bloodGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="cityDesktop">City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="cityDesktop" className="mt-1.5">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={onSearch} disabled={isSearching} className="gap-2 w-full md:w-auto">
                  <Search className="h-4 w-4" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MOBILE SEARCH FORM (< 768px) */}
      <div className="block md:hidden">
        <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <CardContent className="p-3.5 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                  Blood Group
                </Label>
                {selectedBloodGroup !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedBloodGroup('all')}
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Show All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedBloodGroup('all')}
                  className={cn(
                    'py-2 px-1 rounded-xl text-xs font-black border transition-all text-center',
                    selectedBloodGroup === 'all'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white dark:bg-card text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800'
                  )}
                >
                  All
                </button>
                {bloodGroups.map(group => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedBloodGroup(group)}
                    className={cn(
                      'py-2 px-1 rounded-xl text-xs font-black border transition-all text-center',
                      selectedBloodGroup === group
                        ? 'bg-red-600 text-white border-red-600 scale-[1.02]'
                        : 'bg-white dark:bg-card text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800'
                    )}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-10 rounded-xl bg-card border-gray-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <SelectValue placeholder="Select City / Region" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={onSearch} 
                disabled={isSearching}
                className="w-full h-10 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? 'Searching...' : 'Search Blood'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default BloodSearchFilters;
