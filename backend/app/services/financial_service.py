"""
Financial Service - Cálculos de margens, impostos e análise de rentabilidade

Responsabilidade: Lógica de negócio financeira
- Cálculo de margens bruta e líquida
- Cálculo de impostos
- Análise de rentabilidade
- Preço efetivo
"""

from app.models.models import SupplierPricing, Supplier
from sqlalchemy.orm import Session
from typing import Dict, List


class FinancialCalculator:
    """Calculadora financeira profissional para fornecedores"""
    
    @staticmethod
    def calculate_margins(
        cost_price: float,
        sale_price: float,
        transportation_cost: float = 0,
        icms_rate: float = 0,
        ipi_rate: float = 0,
        cofins_rate: float = 0,
        pis_rate: float = 0,
        other_taxes: float = 0
    ) -> Dict[str, float]:
        """
        Calcula margens bruta, líquida, lucro e impostos
        
        Retorna:
            - gross_margin: Margem bruta (%)
            - net_margin: Margem líquida (%)
            - profit_amount: Valor lucro unitário
            - total_taxes_pct: Total impostos (%)
            - total_taxes_value: Valor total impostos
            - effective_cost: Custo efetivo (custo + frete + impostos)
            - gross_profit: Lucro bruto unitário
            - net_profit: Lucro líquido unitário
            - roi_percentage: ROI %
        """
        
        # Validação básica
        if cost_price <= 0 or sale_price <= 0:
            raise ValueError("Preços deve ser maiores que zero")
        
        if sale_price < cost_price:
            raise ValueError("Preço de venda não pode ser menor que custo")
        
        # Cálculo de impostos totais (em valor)
        total_taxes_pct = icms_rate + ipi_rate + cofins_rate + pis_rate + other_taxes
        
        # Cálculo do valor efetivo de custo (custo + frete + impostos)
        # Impostos são calculados sobre o valor de venda para ser mais realista
        taxes_value = (sale_price * total_taxes_pct) / 100
        effective_cost = cost_price + transportation_cost + taxes_value
        
        # Margens
        gross_profit = sale_price - cost_price
        gross_margin = (gross_profit / sale_price * 100) if sale_price > 0 else 0
        
        net_profit = sale_price - effective_cost
        net_margin = (net_profit / sale_price * 100) if sale_price > 0 else 0
        
        # ROI (Return on Investment)
        roi_percentage = (net_profit / cost_price * 100) if cost_price > 0 else 0
        
        return {
            'gross_margin': round(gross_margin, 2),
            'net_margin': round(net_margin, 2),
            'profit_amount': round(net_profit, 2),
            'gross_profit': round(gross_profit, 2),
            'net_profit': round(net_profit, 2),
            'total_taxes_pct': round(total_taxes_pct, 2),
            'total_taxes_value': round(taxes_value, 2),
            'effective_cost': round(effective_cost, 2),
            'roi_percentage': round(roi_percentage, 2)
        }
    
    @staticmethod
    def update_supplier_pricing(
        pricing: SupplierPricing,
        cost_price: float = None,
        sale_price: float = None,
        transportation_cost: float = None,
        icms_rate: float = None,
        ipi_rate: float = None,
        cofins_rate: float = None,
        pis_rate: float = None,
        other_taxes: float = None
    ) -> None:
        """Atualiza SupplierPricing com cálculos de apenas"""
        
        # Usar valores existentes se não fornecidos
        cost = cost_price if cost_price is not None else pricing.cost_price
        sale = sale_price if sale_price is not None else pricing.sale_price
        transport = transportation_cost if transportation_cost is not None else pricing.transportation_cost
        icms = icms_rate if icms_rate is not None else pricing.icms_rate
        ipi = ipi_rate if ipi_rate is not None else pricing.ipi_rate
        cofins = cofins_rate if cofins_rate is not None else pricing.cofins_rate
        pis = pis_rate if pis_rate is not None else pricing.pis_rate
        other = other_taxes if other_taxes is not None else pricing.other_taxes
        
        # Calcular margens
        margins = FinancialCalculator.calculate_margins(
            cost_price=cost,
            sale_price=sale,
            transportation_cost=transport,
            icms_rate=icms,
            ipi_rate=ipi,
            cofins_rate=cofins,
            pis_rate=pis,
            other_taxes=other
        )
        
        # Atualizar objeto
        if cost_price is not None:
            pricing.cost_price = cost_price
        if sale_price is not None:
            pricing.sale_price = sale_price
        if transportation_cost is not None:
            pricing.transportation_cost = transportation_cost
        if icms_rate is not None:
            pricing.icms_rate = icms_rate
        if ipi_rate is not None:
            pricing.ipi_rate = ipi_rate
        if cofins_rate is not None:
            pricing.cofins_rate = cofins_rate
        if pis_rate is not None:
            pricing.pis_rate = pis_rate
        if other_taxes is not None:
            pricing.other_taxes = other_taxes
        
        # Atualizar margens calculadas
        pricing.gross_margin = margins['gross_margin']
        pricing.net_margin = margins['net_margin']
        pricing.profit_amount = margins['profit_amount']


class FinancialAnalyzer:
    """Analisador de rentabilidade de fornecedores"""
    
    @staticmethod
    def analyze_supplier_profitability(supplier_id: int, db: Session) -> Dict:
        """Analisa rentabilidade geral de um fornecedor"""
        
        pricings = db.query(SupplierPricing).filter(
            SupplierPricing.supplier_id == supplier_id,
            SupplierPricing.is_active == True
        ).all()
        
        if not pricings:
            return {
                'total_products': 0,
                'average_gross_margin': 0,
                'average_net_margin': 0,
                'average_profit_per_unit': 0,
                'highest_margin_product': None,
                'lowest_margin_product': None,
                'most_profitable_product': None
            }
        
        margins = [p.net_margin for p in pricings]
        profits = [p.profit_amount for p in pricings]
        
        avg_gross_margin = sum([p.gross_margin for p in pricings]) / len(pricings)
        avg_net_margin = sum(margins) / len(margins)
        avg_profit = sum(profits) / len(profits)
        
        highest_margin_product = max(pricings, key=lambda x: x.net_margin).product_name
        lowest_margin_product = min(pricings, key=lambda x: x.net_margin).product_name
        most_profitable_product = max(pricings, key=lambda x: x.profit_amount).product_name
        
        return {
            'total_products': len(pricings),
            'average_gross_margin': round(avg_gross_margin, 2),
            'average_net_margin': round(avg_net_margin, 2),
            'average_profit_per_unit': round(avg_profit, 2),
            'highest_margin_product': highest_margin_product,
            'lowest_margin_product': lowest_margin_product,
            'most_profitable_product': most_profitable_product
        }
    
    @staticmethod
    def compare_supplier_pricing(
        supplier_ids: List[int],
        product_name: str,
        db: Session
    ) -> List[Dict]:
        """Compara preços do mesmo produto entre fornecedores"""
        
        results = []
        for supplier_id in supplier_ids:
            pricings = db.query(SupplierPricing).filter(
                SupplierPricing.supplier_id == supplier_id,
                SupplierPricing.product_name.ilike(f"%{product_name}%"),
                SupplierPricing.is_active == True
            ).all()
            
            if pricings:
                for pricing in pricings:
                    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
                    results.append({
                        'supplier_id': supplier_id,
                        'supplier_name': supplier.name if supplier else 'Unknown',
                        'product_name': pricing.product_name,
                        'cost_price': pricing.cost_price,
                        'sale_price': pricing.sale_price,
                        'net_margin': pricing.net_margin,
                        'profit_amount': pricing.profit_amount,
                        'currency': pricing.currency
                    })
        
        # Ordenar por preço de venda (asc)
        return sorted(results, key=lambda x: x['sale_price'])
