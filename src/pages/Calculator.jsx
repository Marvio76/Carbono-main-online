import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Car, Home, Utensils, ShoppingBag, Calculator as CalcIcon, Leaf, Sparkles } from 'lucide-react';

import { useData } from '../contexts/DataContext'; // CORRIGIDO AQUI!
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { useToast } from '../components/ui/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter
} from '../components/ui/alert-dialog';

const Calculator = () => {
  const [formData, setFormData] = useState({
    transport: { carKm: 0, publicTransport: 0, flights: 0 },
    energy: { electricity: 100, gas: 1, airConditioning: 0 },
    food: { meat: 3, dairy: 2, foodWaste: 2 },
    consumption: { shopping: 2, waste: 1, recycling: 3 }
  });

  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const { addCarbonData } = useData() || {}; // Para evitar undefined
  const { toast } = useToast();

  const categories = [
    {
      key: 'transport',
      title: 'Transporte',
      icon: Car,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      fields: [
        { key: 'carKm', label: 'Quantos km você dirige por semana?', max: 500, unit: 'km' },
        { key: 'publicTransport', label: 'Viagens de transporte público por semana', max: 20, unit: 'viagens' },
        { key: 'flights', label: 'Voos de avião por ano', max: 10, unit: 'voos' }
      ]
    },
    {
      key: 'energy',
      title: 'Energia em Casa',
      icon: Home,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      fields: [
        { key: 'electricity', label: 'Qual o valor aproximado da sua conta de luz?', max: 500, unit: 'R$' },
        { key: 'gas', label: 'Quantos botijões de gás você usa por mês?', max: 5, unit: 'botijões' },
        { key: 'airConditioning', label: 'Uso de ar-condicionado (horas por dia)', max: 24, unit: 'horas' }
      ]
    },
    {
      key: 'food',
      title: 'Alimentação',
      icon: Utensils,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      fields: [
        { key: 'meat', label: 'Refeições com carne vermelha por semana', max: 21, unit: 'refeições' },
        { key: 'dairy', label: 'Consumo de laticínios (leite, queijo, etc)', max: 5, unit: 'vezes ao dia' },
        { key: 'foodWaste', label: 'Com que frequência você joga comida fora?', max: 5, unit: 'nível (1-5)', description: { min: 'Raramente', max: 'Com frequência' } }
      ]
    },
    {
      key: 'consumption',
      title: 'Seu Consumo',
      icon: ShoppingBag,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      fields: [
        { key: 'shopping', label: 'Compras de roupas e eletrônicos por mês', max: 20, unit: 'itens' },
        { key: 'waste', label: 'Sacos de lixo produzidos por semana', max: 10, unit: 'sacos' },
        { key: 'recycling', label: 'Qual seu nível de reciclagem?', max: 5, unit: 'nível (1-5)', description: { min: 'Não reciclo', max: 'Reciclo tudo' } }
      ]
    }
  ];

  const getFootprintLevel = (value) => {
    if (value < 50) return { level: 'Excelente', color: 'text-green-400', bg: 'eco-gradient' };
    if (value < 100) return { level: 'Bom', color: 'text-blue-400', bg: 'bg-gradient-to-r from-blue-500 to-green-500' };
    if (value < 200) return { level: 'Moderado', color: 'text-yellow-400', bg: 'warning-gradient' };
    return { level: 'Alto', color: 'text-red-400', bg: 'danger-gradient' };
  };

  const generateRecommendations = (data, totalFootprint) => {
    const recs = [];
    const levelInfo = getFootprintLevel(totalFootprint);

    if (levelInfo.level === 'Alto') {
      recs.push("Sua pegada geral é alta. Foque nas categorias com maior impacto.");
    } else if (levelInfo.level === 'Moderado') {
      recs.push("Sua pegada é moderada. Pequenas mudanças podem ajudar bastante.");
    }

    if (data.transport.carKm > 100) recs.push("No Transporte, use mais transporte público ou bicicleta.");
    if (data.energy.electricity > 200) recs.push("Em Energia, tente reduzir o consumo desligando aparelhos.");
    if (data.food.meat > 5) recs.push("Na Alimentação, reduzir carne vermelha ajuda muito.");
    if (data.food.foodWaste > 3) recs.push("Planeje melhor as compras para evitar desperdício.");
    if (data.consumption.recycling < 3) recs.push("Aumente seus esforços de reciclagem.");

    if (recs.length === 0 && (levelInfo.level === 'Excelente' || levelInfo.level === 'Bom')) {
      recs.push("Parabéns! Seus hábitos já são muito sustentáveis.");
    } else if (recs.length === 0) {
      recs.push("Seus hábitos estão equilibrados, mas sempre dá pra melhorar.");
    }

    return recs;
  };

  const calculateFootprint = async () => {
    try {
      const factors = {
        transport: { carKm: 0.21, publicTransport: 2.5, flights: 500 },
        energy: { electricity: 0.2, gas: 15, airConditioning: 0.4 },
        food: { meat: 6.0, dairy: 1.5, foodWaste: 2.5 },
        consumption: { shopping: 10, waste: 5, recycling: -2 }
      };

      const categoryResults = {};
      let total = 0;

      Object.keys(formData).forEach(categoryKey => {
        let categoryTotal = 0;
        Object.keys(formData[categoryKey]).forEach(fieldKey => {
          const value = formData[categoryKey][fieldKey] || 0;
          const factor = factors[categoryKey][fieldKey] || 0;
          categoryTotal += value * factor;
        });
        categoryResults[categoryKey] = Math.max(0, categoryTotal);
        total += categoryTotal;
      });

      const totalFootprint = Math.max(0, total);
      const generatedRecs = generateRecommendations(formData, totalFootprint);

      const dataForBackend = {
        totalFootprint,
        categories: categoryResults,
        recommendations: generatedRecs
      };

      setResult(dataForBackend);
      setRecommendations(generatedRecs);

      if (typeof addCarbonData !== "function") {
        toast({
          title: "Erro",
          description: "Função de salvar dados não está disponível.",
          variant: "destructive"
        });
        return;
      }

      const savedData = await addCarbonData(dataForBackend);

      if (savedData) {
        toast({
          title: "Cálculo salvo com sucesso!",
          description: `Sua pegada de carbono é ${totalFootprint.toFixed(1)} kg CO₂`,
        });
        setIsModalOpen(true);
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar seu cálculo. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro no cálculo",
        description: error?.message || "Algo deu errado.",
        variant: "destructive"
      });
    }
  };

  const updateValue = (category, field, value) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: numericValue
      }
    }));
  };

  return (
    <>
      <Helmet>
        <title>Calculadora - EcoTracker</title>
        <meta name="description" content="Calcule sua pegada de carbono com nossa calculadora." />
      </Helmet>

      <div className="min-h-screen pt-20 px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="gradient-text">Calculadora</span> de Pegada de Carbono
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Ajuste os valores e veja seu impacto.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {categories.map((category, categoryIndex) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <Card className="professional-card">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-3">
                          <div className={`p-3 rounded-lg ${category.bgColor}`}>
                            <Icon className={`h-6 w-6 ${category.color}`} />
                          </div>
                          <span className="text-foreground">{category.title}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {category.fields.map((field) => (
                          <div key={field.key} className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-foreground">{field.label}</Label>
                              <span className="text-primary font-medium text-lg">
                                {formData[category.key][field.key]} {field.unit}
                              </span>
                            </div>
                            <Slider
                              value={[formData[category.key][field.key]]}
                              onValueChange={(value) => updateValue(category.key, field.key, value)}
                              max={field.max}
                              step={1}
                              className="w-full"
                            />
                            {field.description && (
                              <div className="flex justify-between text-xs text-muted-foreground px-1">
                                <span>{field.description.min}</span>
                                <span>{field.description.max}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center">
                <Button onClick={calculateFootprint} size="lg" className="eco-gradient hover:scale-105 transition-transform duration-200">
                  <CalcIcon className="mr-2 h-5 w-5" />
                  Calcular e Salvar
                </Button>
              </motion.div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
              {result && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <Card className="professional-card">
                    <CardHeader className="text-center">
                      <CardTitle className="text-foreground">Sua Pegada de Carbono</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div className={`mx-auto w-24 h-24 ${getFootprintLevel(result.totalFootprint).bg} rounded-full flex items-center justify-center`}>
                        <Leaf className="h-12 w-12 text-white" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-4xl font-bold text-foreground">
                          {result.totalFootprint.toFixed(1)} kg CO₂
                        </p>
                        <p className={`text-xl font-medium ${getFootprintLevel(result.totalFootprint).color}`}>
                          {getFootprintLevel(result.totalFootprint).level}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="professional-card">
                    <CardHeader>
                      <CardTitle className="text-foreground">Por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(result.categories).map(([key, value]) => {
                        const category = categories.find(c => c.key === key);
                        const Icon = category.icon;
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Icon className={`h-5 w-5 ${category.color}`} />
                              <span className="text-muted-foreground">{category.title}</span>
                            </div>
                            <span className="text-foreground font-medium">
                              {value.toFixed(1)} kg CO₂
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-2xl">
              <Sparkles className="mr-3 h-6 w-6 text-yellow-400" />
              Dicas para Reduzir sua Pegada
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Leaf className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground text-sm">{rec}</p>
                </div>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Calculator;
