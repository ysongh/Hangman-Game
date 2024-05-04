from nada_dsl import *

def nada_main():
    party1 = Party(name="Party1")
    my_int1 = SecretInteger(Input(name="letter1", party=party1))
    my_int2 = SecretInteger(Input(name="letter2", party=party1))

    new_int = (my_int1 >= my_int2).if_else(Integer(1), Integer(0))

    return [Output(new_int, "my_output", party1)]