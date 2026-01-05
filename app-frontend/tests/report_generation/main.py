from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

import os
import sys

CURRENT_DIR = os.path.dirname(__file__)
TESTS_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if TESTS_DIR not in sys.path:
    sys.path.insert(0, TESTS_DIR)

from utils.url import URL
from utils.driver import driver
from utils.button_path import target_xpath

wait = WebDriverWait(driver, 10)

def wait_and_click(wait_object, locator):
    """Espera um elemento ser clicável e clica nele."""
    element = wait_object.until(
        EC.element_to_be_clickable(locator)
    )
    element.click()

def wait_and_fill(wait_object, locator, text):
    """Espera um elemento estar visível e preenche com texto."""
    element = wait_object.until(
        EC.visibility_of_element_located(locator)
    )
    element.send_keys(text)

def select_radix_option(wait_object, trigger_locator, option_locator):
    """Função especial para lidar com menus Radix UI.
    1. Clica no botão que abre o menu.
    2. Espera o menu (popper) aparecer.
    3. Clica na opção desejada.
    """
    wait_and_click(wait_object, trigger_locator)
    wait_and_click(wait_object, option_locator)

try:
    # 1. Acessar o frontend
    driver.get(URL)
    print(f"Accessing {URL}...")

    # 2. Logar
    print("Logging in...")
    wait_and_fill(wait, (By.XPATH, "//*[@id='username']"), "tainara.daroca")
    wait_and_fill(wait, (By.XPATH, "//*[@id='password']"), "daroca123456")
    wait_and_click(wait, (By.XPATH, "/html/body/div[1]/div/div/div/form/button"))

    # 3. Acessar a página de relatórios
    print("Accessing the reports page...")
    wait_and_click(wait, (By.XPATH, "/html/body/div[1]/div/nav/div[2]/div/button"))
    wait_and_click(wait, (By.XPATH, "/html/body/div[1]/div/nav/div[2]/div/div/a"))
    
    # 4. Esperar o botão de gerar relatório aparecer
    print("Esperando o botão de gerar relatório...")
    # Usando o 'target_xpath' que você importou
    wait_and_click(wait, (By.XPATH, target_xpath))
    
    # 5. Selecionar o comprador
    print("Selecionando o comprador...")
    buyer_trigger_locator = (By.XPATH, "(//div[@role='dialog']//button[@data-slot='popover-trigger'])[1]")
    buyer_option_locator = (By.XPATH, "//div[@data-radix-popper-content-wrapper]//div[@role='option'][1]") # Pega a primeira opção
    
    select_radix_option(wait, buyer_trigger_locator, buyer_option_locator)

    # 6. Ir para a próxima etapa
    print("Indo para a próxima etapa (1/3)...")
    wait_and_click(wait, (By.XPATH, "//button[contains(., 'Próximo')]")) # Busca botão pelo texto

    # 7. Informações do Transporte
    print("Preenchendo Informações do Transporte...")
    # 7.1 Motorista
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Motorista')]/following-sibling::input"), "Alex")
    # 7.2 Veículo
    vehicle_trigger_locator = (By.XPATH, "//*[@id='vehicleId']")
    vehicle_option_locator = (By.XPATH, "//div[@data-radix-popper-content-wrapper]//div[@role='option'][1]") # Pega a primeira opção
    select_radix_option(wait, vehicle_trigger_locator, vehicle_option_locator)
    # 7.3 Condições sanitárias do veículo = Conforme
    wait_and_click(wait, (By.XPATH, "//label[contains(., 'Conforme')]"))
    # 7.4 Temperatura do veículo (°C)
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Temperatura do veículo')]/following-sibling::input"), "4")
    # 7.5 Ir para a próxima etapa
    print("Indo para a próxima etapa (2/3)...")
    wait_and_click(wait, (By.XPATH, "//button[contains(., 'Próximo')]"))

    # 8. Produto
    print("Preenchendo informações do Produto...")
    # 8.1 N° Nota Fiscal
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Nota Fiscal')]/following-sibling::input"), "789654")
    # 8.2 Produto
    product_trigger_locator = (By.XPATH, "//button[contains(., 'Selecione um produto')]")
    product_option_locator = (By.XPATH, "//div[@data-radix-popper-content-wrapper]//*[text()='Linguiça Suína - 650g']")
    select_radix_option(wait, product_trigger_locator, product_option_locator)
    # 8.3 Quantidade
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Quantidade (Unidade)')]/following::input[1]"), "25")
    # 8.4 SIF ou SISBI? (Assumindo que é um radio button ou checkbox com o texto 'SIF')
    wait_and_click(wait, (By.XPATH, "//label[normalize-space()='Sim']"))
    # 8.5 Temperatura do produto (°C)
    wait_and_fill(wait, (By.XPATH, "//input[@placeholder='Ex.: 4,5']"), "3")
    # 8.6 Lote
    lote_trigger_locator = (By.XPATH, "//button[contains(., 'Selecione uma data')]")
    lote_date_locator = (By.XPATH, "(//div[@data-radix-popper-content-wrapper]//button[normalize-space()='15'])[1]")
    select_radix_option(wait, lote_trigger_locator, lote_date_locator)
    # 8.7 Ir para a próxima etapa
    print("Indo para a próxima etapa (3/3)...")
    wait_and_click(wait, (By.XPATH, "//button[contains(., 'Próximo')]"))

    # 9. Confirmar relatório
    print("Confirmando relatório...")
    wait_and_click(wait, (By.XPATH, "//button[contains(., 'Confirmar')]"))
    # 10. Esperar confirmação
    print("Aguardando confirmação do relatório...")
    wait.until(EC.text_to_be_present_in_element(
        (By.XPATH, "//div[@role='alert']"),
        "Relatório gerado com sucesso!"
    ))
    print("Relatório gerado com sucesso!")


except TimeoutException:
    print(f"Erro: O elemento não foi encontrado ou não ficou clicável a tempo.")
    driver.save_screenshot("erro_timeout.png")
except Exception as e:
    print(f"Ocorreu um erro inesperado: {e}")
    driver.save_screenshot("erro_inesperado.png")

finally:
    print("Fechando o navegador.")
    driver.quit()