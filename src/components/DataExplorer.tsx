
import React, { useState } from 'react';
import { Card } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Share2, Settings } from 'lucide-react';

// Simulated data
const mockData = Array.from({ length: 365 }, (_, i) => ({
  date: new Date(2023, 0, i + 1).toISOString(),
  cases: Math.floor(Math.random() * 200),
}));

const DataExplorer: React.FC = () => {
  const [metric, setMetric] = useState('confirmed');
  const [frequency, setFrequency] = useState('7day');
  const [searchTerm, setSearchTerm] = useState('');

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
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">METRIC</h3>
              <RadioGroup defaultValue="confirmed" onValueChange={setMetric} className="flex flex-col space-y-2">
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
              <RadioGroup defaultValue="7day" onValueChange={setFrequency} className="flex flex-col space-y-2">
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
                  {['World', 'North America', 'Europe', 'Asia', 'Africa', 'Oceania'].map((region) => (
                    <div key={region} className="flex items-center space-x-2">
                      <input type="checkbox" id={region} className="rounded border-gray-300" />
                      <label htmlFor={region} className="text-sm">{region}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <Tabs defaultValue="chart" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="chart" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="cases" 
                  stroke="#1E40AF" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="table">
            <div className="text-center py-8 text-muted-foreground">
              Table view coming soon
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="text-center py-8 text-muted-foreground">
              Map view coming soon
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground border-t pt-4">
          <p>Data source: World Health Organization</p>
          <p className="mt-1">CC BY</p>
        </div>
      </Card>
    </div>
  );
};

export default DataExplorer;
