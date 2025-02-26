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
  const [data, setData] = useState<any[]>([]);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<Map | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const [axisScale, setAxisScale] = useState<'linear' | 'log'>('linear');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Fetch real data from the CSV URL
    fetch('https://catalog.ourworldindata.org/explorers/who/latest/monkeypox/monkeypox.csv')
      .then(response => response.text())
      .then(csvText => {
        // Parse CSV and transform data
        const rows = csvText.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const parsedData = rows.slice(1).map(row => {
          const entry: any = {};
          headers.forEach((header, index) => {
            if (header === 'date') {
              entry[header] = row[index];
            } else {
              entry[header] = parseFloat(row[index]) || 0;
            }
          });
          return entry;
        });
        setData(parsedData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
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

  const filteredData = data
    .filter(entry => {
      const date = new Date(entry.date);
      return date >= timeRange[0] && date <= timeRange[1];
    })
    .map(entry => {
      const filtered: Record<string, any> = { date: entry.date };
      selectedRegions.forEach(region => {
        if (frequency === '7day') {
          const index = data.findIndex(d => d.date === entry.date);
          if (index >= 0) {
            let sum = 0;
            let count = 0;
            for (let i = Math.max(0, index - 3); i <= Math.min(data.length - 1, index + 3); i++) {
              const value = data[i][region];
              if (typeof value === 'number') {
                sum += value;
                count++;
              }
            }
            filtered[region] = count > 0 ? Math.round(sum / count) : 0;
          }
        } else {
          filtered[region] = entry[region] || 0;
        }
      });
      return filtered;
    });

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <Card className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Mpox: Daily confirmed cases
          </h1>
          <p className="text-sm text-muted-foreground">
            7-day rolling average. Laboratory testing for mpox is limited in many countries and figures shown here only include laboratory-confirmed cases.
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
                      ? "Linear: A linear scale evenly spaces values, where each increment represents a consistent change. A logarithmic scale uses multiples of the starting value, with each increment representing the same percentage increase."
                      : "Logarithmic: A logarithmic scale uses values that increase exponentially, where each increment represents a fixed percentage increase rather than a fixed amount. The scale is based on multiples of a starting value, and the distance between values grows as the numbers get larger."
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
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`;
                    }}
                    minTickGap={50}
                  />
                  <YAxis scale={axisScale} />
                  <Tooltip 
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('en-US', { 
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      });
                    }}
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
                  {new Date(timeRange[0]).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
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
                  {new Date(timeRange[1]).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="h-[500px] rounded-lg overflow-hidden border relative">
              <div ref={mapElement} className="w-full h-full bg-[#f8f9fa]" />
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
