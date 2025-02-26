
import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, Play } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import OSM from 'ol/source/OSM';
import 'ol/ol.css';
import { ScaleType } from 'recharts/types/util/types';

const getColorForValue = (value: number): string => {
  if (value === 0) return '#f8f9fa';  // No data color
  if (value < 1) return '#fee5d9';
  if (value < 2) return '#fcbba1';
  if (value < 5) return '#fc9272';
  if (value < 10) return '#fb6a4a';
  if (value < 20) return '#ef3b2c';
  if (value < 50) return '#cb181d';
  if (value < 100) return '#a50f15';
  if (value < 200) return '#67000d';
  if (value < 500) return '#4a0000';
  return '#270000';  // 1000+
};

const generateData = (metric: string) => {
  const startDate = new Date(2022, 4, 1);
  const endDate = new Date(2025, 1, 16);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const multiplier = metric === 'deaths' ? 0.1 : metric === 'suspected' ? 1.5 : 1;
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const peak = i > 150 && i < 200 ? 4 : 1;
    
    const generateCountryData = (baseValue: number) => 
      Math.floor(Math.random() * baseValue * peak * multiplier) * (Math.exp(-i/300));

    const data: Record<string, number> = {};
    
    countries.forEach(country => {
      let baseValue = 1000; // Default base value
      
      if (country === 'World') baseValue = 5000;
      else if (country.includes('America') || country === 'Europe' || country === 'Asia') baseValue = 3000;
      else if (['United States', 'China', 'India', 'Brazil'].includes(country)) baseValue = 2000;
      else if (['France', 'Germany', 'United Kingdom', 'Japan'].includes(country)) baseValue = 1500;
      
      data[country] = generateCountryData(baseValue);
    });

    return {
      date: date.toISOString(),
      ...data
    };
  });
};

const countries = [
  'World',
  'North America',
  'Africa',
  'Andorra',
  'Angola',
  'Argentina',
  'Aruba',
  'Asia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Barbados',
  'Belgium',
  'Benin',
  'Bermuda',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Brazil',
  'Bulgaria',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chile',
  'China',
  'Colombia',
  'Congo',
  'Costa Rica',
  'Cote d\'Ivoire',
  'Croatia',
  'Cuba',
  'Curacao',
  'Cyprus',
  'Czechia',
  'Democratic Republic of Congo',
  'Denmark',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Estonia',
  'Europe',
  'Finland',
  'France',
  'Gabon',
  'Georgia',
  'Germany',
  'Ghana',
  'Gibraltar',
  'Greece',
  'Greenland',
  'Guadeloupe',
  'Guam',
  'Guatemala',
  'Guinea',
  'Guyana',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kenya',
  'Kosovo',
  'Laos',
  'Latvia',
  'Lebanon',
  'Liberia',
  'Lithuania',
  'Luxembourg',
  'Malaysia',
  'Malta',
  'Martinique',
  'Mauritius',
  'Mexico',
  'Moldova',
  'Monaco',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Nepal',
  'Netherlands',
  'New Caledonia',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Oceania',
  'Oman',
  'Pakistan',
  'Panama',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Martin (French part)',
  'San Marino',
  'Saudi Arabia',
  'Serbia',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South America',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Trinidad and Tobago',
  'Turkey',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Venezuela',
  'Vietnam',
  'Zambia',
  'Zimbabwe'
];

const DataExplorer: React.FC = () => {
  const [metric, setMetric] = useState('confirmed');
  const [frequency, setFrequency] = useState('7day');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['World']);
  const startDate = new Date(2022, 4, 1);
  const endDate = new Date(2025, 1, 16);
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const [timeRange, setTimeRange] = useState<[Date, Date]>([startDate, endDate]);
  const [sliderValues, setSliderValues] = useState([0, 100]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mockData, setMockData] = useState(generateData(metric));
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const [axisScale, setAxisScale] = useState<'number' | 'category'>('number');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setMockData(generateData(metric));
  }, [metric]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  const handleRegionChange = (region: string) => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        const newSelection = prev.filter(r => r !== region);
        return newSelection;
      } else {
        return [...prev, region];
      }
    });
  };

  const handlePlayTimelapse = () => {
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    let currentValue = sliderValues[0];

    playIntervalRef.current = setInterval(() => {
      currentValue += 1;
      
      if (currentValue > 100) {
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
          playIntervalRef.current = null;
        }
        setIsPlaying(false);
        return;
      }

      setSliderValues([sliderValues[0], currentValue]);
      handleSliderChange([sliderValues[0], currentValue]);
    }, 100); // Update every 100ms
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleSliderChange = (values: number[]) => {
    setSliderValues(values);
    const start = new Date(startDate.getTime() + (values[0] / 100) * totalDays * 24 * 60 * 60 * 1000);
    const end = new Date(startDate.getTime() + (values[1] / 100) * totalDays * 24 * 60 * 60 * 1000);
    setTimeRange([start, end]);
  };

  const filteredAndSortedCountries = countries
    .filter(country => 
      country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a === 'World') return -1;
      if (b === 'World') return 1;
      return a.localeCompare(b);
    });

  const handleClearSelection = () => {
    setSelectedRegions(['World']);
  };

  const filteredData = mockData
    .filter(entry => {
      const date = new Date(entry.date);
      return date >= timeRange[0] && date <= timeRange[1];
    })
    .map(entry => {
      const filtered: Record<string, string | number> = { date: entry.date };
      selectedRegions.forEach(region => {
        if (frequency === '7day') {
          const index = mockData.findIndex(d => d.date === entry.date);
          if (index >= 0) {
            let sum = 0;
            let count = 0;
            for (let i = Math.max(0, index - 3); i <= Math.min(mockData.length - 1, index + 3); i++) {
              const value = mockData[i][region as keyof typeof mockData[0]];
              if (typeof value === 'number') {
                sum += value;
                count++;
              }
            }
            filtered[region] = count > 0 ? Math.round(sum / count) : 0;
          }
        } else {
          const value = entry[region as keyof typeof entry];
          filtered[region] = typeof value === 'number' ? value : 0;
        }
      });
      return filtered;
    });

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <Card className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Mpox Data Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Explore the data produced by the World Health Organization and Africa CDC on mpox (monkeypox).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">METRIC</h3>
            <RadioGroup value={metric} onValueChange={setMetric} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="confirmed" id="confirmed" />
                <Label htmlFor="confirmed">Confirmed cases</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suspected" id="suspected" />
                <Label htmlFor="suspected">Confirmed and suspected cases</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deaths" id="deaths" />
                <Label htmlFor="deaths">Confirmed deaths</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">FREQUENCY</h3>
            <RadioGroup value={frequency} onValueChange={setFrequency} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7day" id="7day" />
                <Label htmlFor="7day">7-day average</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cumulative" id="cumulative" />
                <Label htmlFor="cumulative">Cumulative</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Daily</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">LOCATIONS</h3>
            <div className="space-y-4">
              <Input 
                placeholder="Type to add a country or region..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-2">
                  {countries
                    .filter(country => 
                      country.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((country) => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox 
                          id={country} 
                          checked={selectedRegions.includes(country)}
                          onCheckedChange={() => handleRegionChange(country)}
                        />
                        <Label htmlFor={country} className="text-sm">{country}</Label>
                      </div>
                    ))}
                </div>
              </ScrollArea>
              {selectedRegions.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearSelection}
                  className="w-full"
                >
                  Clear selection
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="chart" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {settingsOpen && (
            <Card className="p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold">LINE CHART SETTINGS</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Axis scale</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={axisScale === 'linear' ? 'secondary' : 'outline'}
                      onClick={() => setAxisScale('linear')}
                      className="w-full justify-center"
                    >
                      Linear
                    </Button>
                    <Button 
                      variant={axisScale === 'log' ? 'secondary' : 'outline'}
                      onClick={() => setAxisScale('log')}
                      className="w-full justify-center"
                    >
                      Logarithmic
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {axisScale === 'linear' 
                      ? "A linear scale evenly spaces values, where each increment represents a consistent change. A logarithmic scale uses multiples of the starting value, with each increment representing the same percentage increase."
                      : "A logarithmic scale uses values that increase exponentially, where each increment represents a fixed percentage increase rather than a fixed amount. The scale is based on multiples of a starting value, and the distance between values grows as the numbers get larger."
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}

          <TabsContent value="chart" className="space-y-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => formatDate(new Date(date))}
                    minTickGap={50}
                  />
                  <YAxis type={axisScale === 'number' ? 'number' : 'category'} />
                  <Tooltip 
                    labelFormatter={(label) => formatDate(new Date(label))}
                    formatter={(value: number) => [Math.round(value), '']}
                  />
                  {selectedRegions.map((region, index) => (
                    <Line 
                      key={region}
                      type="monotone" 
                      dataKey={region} 
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="h-7 px-3" onClick={handlePlayTimelapse}>
                  {isPlaying ? (
                    <>
                      <div className="w-3 h-3 mr-2 bg-primary rounded-sm" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-2" />
                      Play time-lapse
                    </>
                  )}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {formatDate(timeRange[0])}
                </div>
                <div className="flex-1 mx-4">
                  <Slider
                    value={sliderValues}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                    disabled={isPlaying}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(timeRange[1])}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="h-[500px] rounded-lg overflow-hidden border relative">
              <div ref={mapElement} className="w-full h-full bg-[#f8f9fa]" />
              <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium mb-2">Cases per 100,000 people</div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-12 text-muted-foreground">No data</div>
                  {[0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map((value, i) => (
                    <div key={value} className="flex flex-col items-center">
                      <div 
                        className="w-6 h-4" 
                        style={{ backgroundColor: getColorForValue(value) }}
                      />
                      <span className="mt-1">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="h-7 px-3" onClick={handlePlayTimelapse}>
                  {isPlaying ? (
                    <>
                      <div className="w-3 h-3 mr-2 bg-primary rounded-sm" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-2" />
                      Play time-lapse
                    </>
                  )}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {formatDate(timeRange[0])}
                </div>
                <div className="flex-1 mx-4">
                  <Slider
                    value={sliderValues}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                    disabled={isPlaying}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(timeRange[1])}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground border-t pt-4">
          <p>Data source: World Health Organization</p>
        </div>
      </Card>
    </div>
  );
};

export default DataExplorer;
