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
    element.clear() 
    element.send_keys(text)

def select_radix_option(wait_object, trigger_locator, option_locator):
    """Função especial para lidar com menus Radix UI."""
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
    wait_and_click(wait, (By.XPATH, "//form//button[@type='submit']"))

    # 3. Acessar a página de Clientes
    print("Accessing the clients page...")
    wait_and_click(wait, (By.XPATH, "//nav//button[contains(., 'Administração')]"))
    wait_and_click(wait, (By.XPATH, "//nav//a[contains(., 'Clientes')]"))

    # 4. Botão de Cadastrar Clientes
    print("Clicking the register client button...")
    wait_and_click(wait, (By.XPATH, "//button[contains(., '+ Cadastrar Cliente')]"))

    # 5. Preencher o formulário de cadastro de cliente
    print("Preenchendo dados principais...")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Código Do Cliente')]/following::input[1]"), "12345")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Razão Social')]/following::input[1]"), "Empresa Teste Selenium LTDA")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Nome Fantasia')]/following::input[1]"), "Nome Fantasia Teste")

    print("Preenchendo dados fiscais...")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'CNPJ/CPF')]/following::input[1]"), "00.123.456/0001-78")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Inscrição Estadual')]/following::input[1]"), "123456789")
    wait_and_fill(wait, (By.XPATH, "//input[@placeholder='Ex.: Rede Cerramix']"), "Rede Teste")

    print("Preenchendo dados de contato...")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Email')]/following::input[1]"), "teste@empresa.com")
    
    print("Preenchendo 'Telefone' (campo com máscara)...")
    telefone_locator = (By.XPATH, "//input[@placeholder='(99) 99999-9999']")
    telefone_field = wait.until(EC.element_to_be_clickable(telefone_locator))
    telefone_field.click() 
    telefone_field.send_keys("61999998888")

    print("Preenchendo endereço...")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Estado')]/following::input[1]"), "DF")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Bairro')]/following::input[1]"), "Asa Sul")
    wait_and_fill(wait, (By.XPATH, "//label[contains(., 'Endereço')]/following::input[1]"), "QS 14 CONJUNTO 07 LOTE 03/04")

    print("Preenchendo 'CEP' (campo com máscara)...")
    cep_locator = (By.XPATH, "//input[@placeholder='12345-678']")
    cep_field = wait.until(EC.element_to_be_clickable(cep_locator))
    cep_field.click()
    cep_field.send_keys("71000123")

    print("Preenchendo forma de pagamento...")
    wait_and_fill(wait, (By.XPATH, "//input[@placeholder='Ex.: Boleto Santander']"), "Boleto Santander")

    # 6. Salvar o formulário
    print("Preenchimento concluído. Clicando em Salvar...")
    wait_and_click(wait, (By.XPATH, "//button[contains(., 'Salvar')]"))

    print("Aguardando confirmação de sucesso...")
    wait.until(
        EC.visibility_of_element_located((By.XPATH, "//*[contains(., 'Cliente cadastrado com sucesso')]"))
    )
    print("Teste concluído com sucesso!")

except TimeoutException:
    print(f"Erro: O elemento não foi encontrado ou não ficou clicável a tempo.")
    driver.save_screenshot("erro_timeout.png")
except Exception as e:
    print(f"Ocorreu um erro inesperado: {e}")
    driver.save_screenshot("erro_inesperado.png")

finally:
    print("Fechando o navegador.")
    driver.quit()