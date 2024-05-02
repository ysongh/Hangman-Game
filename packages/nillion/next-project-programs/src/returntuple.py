from nada_dsl import *

def nada_main():
    party1 = Party(name="Party1")
    my_int1 = SecretInteger(Input(name="my_int1", party=party1))
    my_int2 = SecretInteger(Input(name="my_int2", party=party1))

    my_tuple_1 = Tuple.new(my_int1, my_int2)
    my_array_1 = Array.new(my_tuple_1)
    result = unzip(my_array_1)

    return [Output(result, "my_output", party1)]